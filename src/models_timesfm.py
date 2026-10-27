import os
import numpy as np
import pandas as pd
import timesfm

def run_timesfm_pipeline():
    """
    Ejecuta el pipeline de inferencia Zero-Shot con Google TimesFM (2.5 200M PyTorch).
    Evalúa en el test set (35 días) y genera la proyección de 35 días a ciegas (2025-02-25 a 2025-03-31).
    """
    print("\n=== Inicializando Google TimesFM (google/timesfm-2.5-200m-pytorch) ===")
    tfm = timesfm.TimesFM_2p5_200M_torch.from_pretrained('google/timesfm-2.5-200m-pytorch')
    forecast_config = timesfm.ForecastConfig(max_context=512, max_horizon=35, normalize_inputs=True)
    tfm.compile(forecast_config)

    df_train = pd.read_csv('datos-crudos/split_train.csv')
    df_val = pd.read_csv('datos-crudos/split_val.csv')
    df_test = pd.read_csv('datos-crudos/split_test.csv')

    for d in [df_train, df_val, df_test]:
        d['Fecha'] = pd.to_datetime(d['Fecha'])

    # Serie histórica completa
    df_train_val = pd.concat([df_train, df_val]).reset_index(drop=True)
    df_full = pd.concat([df_train, df_val, df_test]).reset_index(drop=True)

    stations = ['Puerto Ayacucho', 'Caicara el mini mini', 'Ciudad Bolívar', 'Palúa']
    context_len = 512
    horizon = 35

    test_metrics = []
    test_preds = {'Fecha': df_test['Fecha'].iloc[:horizon].values}
    forecast_preds = {'Fecha': pd.date_range('2025-02-25', '2025-03-31', freq='D')}

    for st in stations:
        print(f"\n--- Inferencia TimesFM para {st} ---")
        # Contexto histórico para Test Set: últimos 512 días de train_val
        ctx_test = df_train_val[st].iloc[-context_len:].values.astype(np.float32)
        y_test_true = df_test[st].iloc[:horizon].values

        mean_fc_test, _ = tfm.forecast(horizon=horizon, inputs=[ctx_test])
        pred_test = mean_fc_test[0]

        # Contexto histórico para Inferencia a Ciegas: últimos 512 días de df_full
        ctx_fc = df_full[st].iloc[-context_len:].values.astype(np.float32)
        mean_fc_blind, _ = tfm.forecast(horizon=horizon, inputs=[ctx_fc])
        pred_blind = mean_fc_blind[0]

        # Métricas
        mae = np.mean(np.abs(y_test_true - pred_test))
        rmse = np.sqrt(np.mean((y_test_true - pred_test)**2))
        mape = np.mean(np.abs((y_test_true - pred_test) / y_test_true)) * 100
        ss_res = np.sum((y_test_true - pred_test)**2)
        ss_tot = np.sum((y_test_true - np.mean(y_test_true))**2)
        r2 = 1 - (ss_res / ss_tot) if ss_tot > 0 else 0

        print(f"[TimesFM Zero-Shot] {st} -> MAE: {mae:.3f}, RMSE: {rmse:.3f}, MAPE: {mape:.2f}%, R2: {r2:.3f}")
        test_metrics.append({
            'Estación': st,
            'Modelo': 'TimesFM',
            'MAE': mae,
            'RMSE': rmse,
            'MAPE': mape,
            'R2': r2
        })

        test_preds[f"{st}_TimesFM"] = pred_test
        forecast_preds[f"{st}_TimesFM"] = pred_blind

    df_tfm_metrics = pd.DataFrame(test_metrics)
    df_tfm_metrics.to_csv('datos-crudos/metrics_timesfm.csv', index=False)
    pd.DataFrame(test_preds).to_csv('datos-crudos/test_preds_timesfm.csv', index=False)
    pd.DataFrame(forecast_preds).to_csv('datos-crudos/forecast_35d_timesfm.csv', index=False)

    print("\n=== RESUMEN MÉTRICAS TIMESFM (35 DÍAS TEST) ===")
    print(df_tfm_metrics.to_string(index=False))

    return df_tfm_metrics

if __name__ == '__main__':
    run_timesfm_pipeline()
