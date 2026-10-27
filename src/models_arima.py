import os
import joblib
import pandas as pd
import numpy as np
from pmdarima import auto_arima
from pmdarima.arima import ARIMA
import matplotlib.pyplot as plt

def get_exog_cols(target_station):
    """
    Retorna las variables exógenas permitidas para la estación según AGENTS.md:
    Codificación cíclica anual (sin_doy, cos_doy) +
    Lags de estaciones aguas arriba (Puerto Ayacucho y Caicara en t-7, t-14, t-17).
    """
    base_exog = ['sin_doy', 'cos_doy']
    if target_station == 'Puerto Ayacucho':
        return base_exog
    elif target_station == 'Caicara el mini mini':
        return base_exog + ['Puerto Ayacucho_lag_7', 'Puerto Ayacucho_lag_14', 'Puerto Ayacucho_lag_17']
    elif target_station in ['Ciudad Bolívar', 'Palúa']:
        return base_exog + [
            'Puerto Ayacucho_lag_7', 'Puerto Ayacucho_lag_14', 'Puerto Ayacucho_lag_17',
            'Caicara el mini mini_lag_7', 'Caicara el mini mini_lag_14', 'Caicara el mini mini_lag_17'
        ]
    return base_exog

def run_arima_pipeline(output_dir='src/models_saved/arima'):
    os.makedirs(output_dir, exist_ok=True)
    df_train = pd.read_csv('datos-crudos/split_train.csv')
    df_val = pd.read_csv('datos-crudos/split_val.csv')
    df_test = pd.read_csv('datos-crudos/split_test.csv')

    for d in [df_train, df_val, df_test]:
        d['Fecha'] = pd.to_datetime(d['Fecha'])

    df_train_clean = df_train.dropna().reset_index(drop=True)
    df_train_val = pd.concat([df_train, df_val]).dropna().reset_index(drop=True)
    
    stations = ['Puerto Ayacucho', 'Caicara el mini mini', 'Ciudad Bolívar', 'Palúa']
    
    results = {}
    test_metrics = []

    test_len = len(df_test)
    h_eval = 35 # Comparativa sobre horizonte equivalente de 35 días

    print(f"Longitud de Test Set: {test_len} días. Se evaluará el primer bloque de 35 días.")

    for st in stations:
        print(f"\n=================== Procesando Estación: {st} ===================")
        y_train = df_train_clean[st]
        
        # 1. AutoARIMA Univariado
        print(f"--- Ajustando AutoARIMA Univariado ({st}) ---")
        model_uni = auto_arima(
            y_train,
            seasonal=False,
            trace=False,
            error_action='ignore',
            suppress_warnings=True,
            stepwise=True,
            max_p=4, max_q=4, max_d=2
        )
        print(f"Mejor orden Univariado: {model_uni.order}")
        joblib.dump(model_uni, os.path.join(output_dir, f"arima_uni_{st.replace(' ', '_')}.pkl"))

        # Re-ajuste sobre train+val para el test set
        model_uni_val = ARIMA(order=model_uni.order, suppress_warnings=True)
        model_uni_val.fit(df_train_val[st])
        preds_uni_test = model_uni_val.predict(n_periods=test_len)

        # 2. ARIMAX Multivariado (con exógenas)
        exog_cols = get_exog_cols(st)
        print(f"--- Ajustando ARIMAX con exógenas: {exog_cols} ---")
        X_train = df_train_clean[exog_cols]
        X_test = df_test[exog_cols]
        X_train_val = df_train_val[exog_cols]

        model_arimax = auto_arima(
            y_train,
            X=X_train,
            seasonal=False,
            trace=False,
            error_action='ignore',
            suppress_warnings=True,
            stepwise=True,
            max_p=4, max_q=4, max_d=2
        )
        print(f"Mejor orden ARIMAX: {model_arimax.order}")
        joblib.dump(model_arimax, os.path.join(output_dir, f"arimax_{st.replace(' ', '_')}.pkl"))

        model_arimax_val = ARIMA(order=model_arimax.order, suppress_warnings=True)
        model_arimax_val.fit(df_train_val[st], X=X_train_val)
        preds_arimax_test = model_arimax_val.predict(n_periods=test_len, X=X_test)

        # Evaluar métricas en los primeros 35 días de test
        y_true_35 = df_test[st].iloc[:h_eval].values
        p_uni_35 = np.array(preds_uni_test)[:h_eval]
        p_arimax_35 = np.array(preds_arimax_test)[:h_eval]

        mae_uni = np.mean(np.abs(y_true_35 - p_uni_35))
        rmse_uni = np.sqrt(np.mean((y_true_35 - p_uni_35)**2))
        mape_uni = np.mean(np.abs((y_true_35 - p_uni_35) / y_true_35)) * 100
        ss_res_u = np.sum((y_true_35 - p_uni_35)**2)
        ss_tot = np.sum((y_true_35 - np.mean(y_true_35))**2)
        r2_uni = 1 - (ss_res_u / ss_tot) if ss_tot > 0 else 0

        mae_max = np.mean(np.abs(y_true_35 - p_arimax_35))
        rmse_max = np.sqrt(np.mean((y_true_35 - p_arimax_35)**2))
        mape_max = np.mean(np.abs((y_true_35 - p_arimax_35) / y_true_35)) * 100
        ss_res_m = np.sum((y_true_35 - p_arimax_35)**2)
        r2_max = 1 - (ss_res_m / ss_tot) if ss_tot > 0 else 0

        print(f"Métricas 35d Test {st} -> AutoARIMA: MAE={mae_uni:.3f}, RMSE={rmse_uni:.3f}, R2={r2_uni:.3f}")
        print(f"Métricas 35d Test {st} -> ARIMAX:    MAE={mae_max:.3f}, RMSE={rmse_max:.3f}, R2={r2_max:.3f}")

        test_metrics.append({
            'Estación': st, 'Modelo': 'AutoARIMA',
            'MAE': mae_uni, 'RMSE': rmse_uni, 'MAPE': mape_uni, 'R2': r2_uni
        })
        test_metrics.append({
            'Estación': st, 'Modelo': 'ARIMAX',
            'MAE': mae_max, 'RMSE': rmse_max, 'MAPE': mape_max, 'R2': r2_max
        })

        results[st] = {
            'preds_uni_test': preds_uni_test,
            'preds_arimax_test': preds_arimax_test,
            'order_uni': model_uni.order,
            'order_arimax': model_arimax.order
        }

    # 3. Proyección de Inferencia a ciegas (35 días: 2025-02-25 a 2025-03-31)
    print("\n=== Generando Inferencia a Ciegas (35 días) ===")
    forecast_dates = pd.date_range('2025-02-25', '2025-03-31', freq='D')
    doy_fc = forecast_dates.day_of_year
    sin_fc = np.sin(2 * np.pi * doy_fc / 365.25)
    cos_fc = np.cos(2 * np.pi * doy_fc / 365.25)

    df_full = pd.concat([df_train, df_val, df_test]).dropna().reset_index(drop=True)
    
    forecast_results = {'Fecha': forecast_dates}
    
    for st in stations:
        m_uni_full = ARIMA(order=results[st]['order_uni'], suppress_warnings=True)
        m_uni_full.fit(df_full[st])
        forecast_results[f"{st}_AutoARIMA"] = m_uni_full.predict(n_periods=len(forecast_dates))

    # ARIMAX de aguas arriba a aguas abajo
    X_fc_pa = pd.DataFrame({'sin_doy': sin_fc, 'cos_doy': cos_fc})
    m_pa_full = ARIMA(order=results['Puerto Ayacucho']['order_arimax'], suppress_warnings=True)
    m_pa_full.fit(df_full['Puerto Ayacucho'], X=df_full[['sin_doy', 'cos_doy']])
    preds_pa_arimax = m_pa_full.predict(n_periods=len(forecast_dates), X=X_fc_pa)
    forecast_results['Puerto Ayacucho_ARIMAX'] = preds_pa_arimax

    df_ext = df_full[['Fecha'] + stations].copy()
    df_future_rows = pd.DataFrame({
        'Fecha': forecast_dates,
        'Puerto Ayacucho': preds_pa_arimax,
        'Caicara el mini mini': np.nan,
        'Ciudad Bolívar': np.nan,
        'Palúa': np.nan
    })
    df_ext = pd.concat([df_ext, df_future_rows]).reset_index(drop=True)

    base_idx = len(df_full)

    # Caicara ARIMAX
    m_cai_full = ARIMA(order=results['Caicara el mini mini']['order_arimax'], suppress_warnings=True)
    m_cai_full.fit(df_full['Caicara el mini mini'], X=df_full[get_exog_cols('Caicara el mini mini')])
    X_fc_cai = []
    for i in range(len(forecast_dates)):
        curr_idx = base_idx + i
        X_fc_cai.append({
            'sin_doy': sin_fc[i],
            'cos_doy': cos_fc[i],
            'Puerto Ayacucho_lag_7': df_ext.loc[curr_idx - 7, 'Puerto Ayacucho'],
            'Puerto Ayacucho_lag_14': df_ext.loc[curr_idx - 14, 'Puerto Ayacucho'],
            'Puerto Ayacucho_lag_17': df_ext.loc[curr_idx - 17, 'Puerto Ayacucho'],
        })
    X_fc_cai = pd.DataFrame(X_fc_cai)
    preds_cai_arimax = m_cai_full.predict(n_periods=len(forecast_dates), X=X_fc_cai)
    forecast_results['Caicara el mini mini_ARIMAX'] = preds_cai_arimax
    df_ext.loc[base_idx:, 'Caicara el mini mini'] = preds_cai_arimax

    # Ciudad Bolívar y Palúa
    for st in ['Ciudad Bolívar', 'Palúa']:
        m_st_full = ARIMA(order=results[st]['order_arimax'], suppress_warnings=True)
        m_st_full.fit(df_full[st], X=df_full[get_exog_cols(st)])
        X_fc_st = []
        for i in range(len(forecast_dates)):
            curr_idx = base_idx + i
            X_fc_st.append({
                'sin_doy': sin_fc[i],
                'cos_doy': cos_fc[i],
                'Puerto Ayacucho_lag_7': df_ext.loc[curr_idx - 7, 'Puerto Ayacucho'],
                'Puerto Ayacucho_lag_14': df_ext.loc[curr_idx - 14, 'Puerto Ayacucho'],
                'Puerto Ayacucho_lag_17': df_ext.loc[curr_idx - 17, 'Puerto Ayacucho'],
                'Caicara el mini mini_lag_7': df_ext.loc[curr_idx - 7, 'Caicara el mini mini'],
                'Caicara el mini mini_lag_14': df_ext.loc[curr_idx - 14, 'Caicara el mini mini'],
                'Caicara el mini mini_lag_17': df_ext.loc[curr_idx - 17, 'Caicara el mini mini'],
            })
        X_fc_st = pd.DataFrame(X_fc_st)
        preds_st = m_st_full.predict(n_periods=len(forecast_dates), X=X_fc_st)
        forecast_results[f"{st}_ARIMAX"] = preds_st
        df_ext.loc[base_idx:, st] = preds_st

    df_metrics = pd.DataFrame(test_metrics)
    df_metrics.to_csv('datos-crudos/metrics_arima_sarimax.csv', index=False)
    
    df_fc = pd.DataFrame(forecast_results)
    df_fc.to_csv('datos-crudos/forecast_35d_arima.csv', index=False)
    
    test_preds_dict = {'Fecha': df_test['Fecha'].values}
    for st in stations:
        test_preds_dict[f"{st}_Real"] = df_test[st].values
        test_preds_dict[f"{st}_AutoARIMA"] = results[st]['preds_uni_test']
        test_preds_dict[f"{st}_ARIMAX"] = results[st]['preds_arimax_test']
    pd.DataFrame(test_preds_dict).to_csv('datos-crudos/test_preds_arima.csv', index=False)

    print("\n=== PIPELINE ARIMA/ARIMAX COMPLETADO EXITOSAMENTE ===")
    print(df_metrics.to_string(index=False))

    return df_metrics, df_fc

if __name__ == '__main__':
    run_arima_pipeline()
