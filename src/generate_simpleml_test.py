import pandas as pd
import numpy as np
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

def run_simpleml_pipeline():
    """
    Genera la inferencia del modelo Baseline Simple-ML (descomposición aditiva
    tendencia lineal + armónicos anuales + residuo autoregresivo AR(1)) sobre el
    conjunto de prueba Test Set (35 días: 2024-12-01 a 2025-01-04),
    calcula sus métricas oficiales (MAE, RMSE, MAPE, R2) y guarda los resultados.
    """
    df_clean = pd.read_csv('datos-crudos/orinoco_2009_2025_limpio.csv')
    df_clean['Fecha'] = pd.to_datetime(df_clean['Fecha'])
    
    df_train = df_clean[(df_clean['Fecha'] >= '2009-01-01') & (df_clean['Fecha'] <= '2024-11-30')].copy()
    df_test = df_clean[(df_clean['Fecha'] >= '2024-12-01') & (df_clean['Fecha'] <= '2025-01-04')].copy() # 35 días
    
    stations = ['Puerto Ayacucho', 'Caicara el mini mini', 'Ciudad Bolívar', 'Palúa']
    
    test_metrics = []
    test_preds_simpleml = {'Fecha': df_test['Fecha'].dt.strftime('%Y-%m-%d').values}
    
    t_tr = np.arange(len(df_train))
    doy_tr = df_train['Fecha'].dt.day_of_year.values
    
    t_te = len(df_train) + np.arange(len(df_test))
    doy_te = df_test['Fecha'].dt.day_of_year.values
    
    X_tr = np.column_stack([
        t_tr,
        np.sin(2 * np.pi * doy_tr / 365.25),
        np.cos(2 * np.pi * doy_tr / 365.25),
        np.sin(4 * np.pi * doy_tr / 365.25),
        np.cos(4 * np.pi * doy_tr / 365.25),
        np.sin(6 * np.pi * doy_tr / 365.25),
        np.cos(6 * np.pi * doy_tr / 365.25),
    ])
    
    X_te = np.column_stack([
        t_te,
        np.sin(2 * np.pi * doy_te / 365.25),
        np.cos(2 * np.pi * doy_te / 365.25),
        np.sin(4 * np.pi * doy_te / 365.25),
        np.cos(4 * np.pi * doy_te / 365.25),
        np.sin(6 * np.pi * doy_te / 365.25),
        np.cos(6 * np.pi * doy_te / 365.25),
    ])
    
    for st in stations:
        y_tr = df_train[st].values
        reg = Ridge(alpha=1.0).fit(X_tr, y_tr)
        
        # Residuo AR(1) autoregresivo de postproceso (idéntico a Simple ML)
        res_last = y_tr[-1] - reg.predict(X_tr[-1:])[0]
        decay = 0.95 ** np.arange(1, len(df_test) + 1)
        pred_te = reg.predict(X_te) + res_last * decay
        
        y_true = df_test[st].values
        mae = float(mean_absolute_error(y_true, pred_te))
        rmse = float(np.sqrt(mean_squared_error(y_true, pred_te)))
        mape = float(np.mean(np.abs((y_true - pred_te) / y_true)) * 100)
        r2 = float(r2_score(y_true, pred_te))
        
        test_metrics.append({
            'Estación': st,
            'Modelo': 'SimpleML',
            'MAE': mae,
            'RMSE': rmse,
            'MAPE': mape,
            'R2': r2
        })
        
        test_preds_simpleml[f"{st}_SimpleML"] = pred_te
        print(f"SimpleML {st}: MAE={mae:.4f}, RMSE={rmse:.4f}, MAPE={mape:.2f}%, R2={r2:.4f}")
        
    df_metrics = pd.DataFrame(test_metrics)
    df_metrics.to_csv('datos-crudos/metrics_simpleml.csv', index=False)
    
    df_preds = pd.DataFrame(test_preds_simpleml)
    df_preds.to_csv('datos-crudos/test_preds_simpleml.csv', index=False)
    print("\nGuardado en datos-crudos/metrics_simpleml.csv y test_preds_simpleml.csv exitosamente.")

if __name__ == '__main__':
    run_simpleml_pipeline()
