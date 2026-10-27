import os
import random
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
import joblib

from deep_learning_models import MultiStepRiverDataset, RiverLSTM, RiverBiLSTM, RiverTransformer

def set_seed(seed=42):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)

def train_and_eval_dl(output_dir='src/models_saved/deep_learning', lookback=60, horizon=35, epochs=60, batch_size=32, lr=1e-3):
    set_seed(42)
    os.makedirs(output_dir, exist_ok=True)
    os.makedirs('datos-crudos', exist_ok=True)

    df_train = pd.read_csv('datos-crudos/split_train.csv')
    df_val = pd.read_csv('datos-crudos/split_val.csv')
    df_test = pd.read_csv('datos-crudos/split_test.csv')

    stations = ['Puerto Ayacucho', 'Caicara el mini mini', 'Ciudad Bolívar', 'Palúa']
    
    # Identificar todas las features numéricas excepto Fecha
    feature_cols = [c for c in df_train.columns if c != 'Fecha']
    
    # Regla Crítica: StandardScaler fitteado EXCLUSIVAMENTE en Train Set (removiendo NaNs iniciales por lags)
    train_clean = df_train.dropna().reset_index(drop=True)
    scaler_X = StandardScaler()
    scaler_y = StandardScaler()

    scaler_X.fit(train_clean[feature_cols].values)
    scaler_y.fit(train_clean[stations].values)

    joblib.dump(scaler_X, os.path.join(output_dir, 'scaler_X.pkl'))
    joblib.dump(scaler_y, os.path.join(output_dir, 'scaler_y.pkl'))

    # Para construir secuencias continuas en val y test necesitamos el contexto previo (lookback días)
    # df_train_val_test continuo:
    df_full = pd.concat([df_train, df_val, df_test]).reset_index(drop=True)
    
    # Transformar features y targets
    X_full_scaled = scaler_X.transform(df_full[feature_cols].bfill().ffill().values)
    y_full_scaled = scaler_y.transform(df_full[stations].values)

    n_train = len(df_train)
    n_val = len(df_val)
    n_test = len(df_test)

    # Ventanas de entrenamiento
    train_dataset = MultiStepRiverDataset(
        X_full_scaled[:n_train],
        y_full_scaled[:n_train],
        lookback=lookback,
        horizon=horizon
    )

    # Ventanas de validación (incluyendo el lookback proveniente del final de train)
    val_start = n_train - lookback
    val_end = n_train + n_val
    val_dataset = MultiStepRiverDataset(
        X_full_scaled[val_start:val_end],
        y_full_scaled[val_start:val_end],
        lookback=lookback,
        horizon=horizon
    )

    # Ventana de test para los primeros 35 días (y para el conjunto de test)
    test_start = n_train + n_val - lookback
    test_end = n_train + n_val + n_test
    test_dataset = MultiStepRiverDataset(
        X_full_scaled[test_start:test_end],
        y_full_scaled[test_start:test_end],
        lookback=lookback,
        horizon=horizon
    )

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)

    input_dim = len(feature_cols)
    models = {
        'LSTM': RiverLSTM(input_dim=input_dim, hidden_dim=64, num_layers=2, horizon=horizon, output_stations=4),
        'Bi-LSTM': RiverBiLSTM(input_dim=input_dim, hidden_dim=64, num_layers=2, horizon=horizon, output_stations=4),
        'Transformer': RiverTransformer(input_dim=input_dim, d_model=64, nhead=4, num_encoder_layers=2, horizon=horizon, output_stations=4)
    }

    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Entrenando modelos de Deep Learning en dispositivo: {device}")

    trained_models = {}
    metrics_records = []

    # Contexto histórico inmediatamente anterior a test (para evaluar los primeros 35 días de test)
    # X_test_window: últimos 'lookback' días antes de test
    x_test_context = torch.tensor(X_full_scaled[n_train + n_val - lookback : n_train + n_val], dtype=torch.float32).unsqueeze(0).to(device)
    y_test_real_35 = df_test[stations].iloc[:horizon].values # [35, 4]

    # Contexto histórico inmediatamente anterior al Forecast Horizon (últimos 60 días de test)
    x_forecast_context = torch.tensor(X_full_scaled[-lookback:], dtype=torch.float32).unsqueeze(0).to(device)

    dl_test_preds = {'Fecha': df_test['Fecha'].iloc[:horizon].values}
    dl_forecast_preds = {'Fecha': pd.date_range('2025-02-25', '2025-03-31', freq='D')}

    for m_name, model in models.items():
        print(f"\n=================== Entrenando {m_name} ===================")
        model = model.to(device)
        criterion = nn.MSELoss()
        optimizer = torch.optim.Adam(model.parameters(), lr=lr, weight_decay=1e-5)
        scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', factor=0.5, patience=5)

        best_val_loss = float('inf')
        best_weights_path = os.path.join(output_dir, f"best_{m_name.lower().replace('-', '_')}.pth")
        patience = 12
        patience_counter = 0

        for epoch in range(1, epochs + 1):
            model.train()
            train_loss = 0.0
            for bx, by in train_loader:
                bx, by = bx.to(device), by.to(device)
                optimizer.zero_grad()
                pred = model(bx)
                loss = criterion(pred, by)
                loss.backward()
                torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
                optimizer.step()
                train_loss += loss.item() * len(bx)
            train_loss /= len(train_dataset)

            model.eval()
            val_loss = 0.0
            with torch.no_grad():
                for vx, vy in val_loader:
                    vx, vy = vx.to(device), vy.to(device)
                    v_pred = model(vx)
                    v_loss = criterion(v_pred, vy)
                    val_loss += v_loss.item() * len(vx)
            val_loss /= len(val_dataset)
            scheduler.step(val_loss)

            if val_loss < best_val_loss:
                best_val_loss = val_loss
                torch.save(model.state_dict(), best_weights_path)
                patience_counter = 0
            else:
                patience_counter += 1

            if epoch % 5 == 0 or patience_counter == 0:
                print(f"Epoch {epoch:02d}/{epochs:02d} | Train Loss: {train_loss:.5f} | Val Loss: {val_loss:.5f} | Patience: {patience_counter}/{patience}")

            if patience_counter >= patience:
                print(f"Early stopping activado en epoch {epoch} (Best Val Loss: {best_val_loss:.5f})")
                break

        # Cargar los mejores pesos
        model.load_state_dict(torch.load(best_weights_path))
        model.eval()
        trained_models[m_name] = model

        # Inferencia en Test (primeros 35 días)
        with torch.no_grad():
            pred_test_scaled = model(x_test_context).cpu().squeeze(0).numpy() # [35, 4]
            pred_test_real = scaler_y.inverse_transform(pred_test_scaled)     # [35, 4]

            # Inferencia a ciegas (35 días horizonte futuro 2025-02-25 a 2025-03-31)
            pred_fc_scaled = model(x_forecast_context).cpu().squeeze(0).numpy() # [35, 4]
            pred_fc_real = scaler_y.inverse_transform(pred_fc_scaled)

        # Calcular métricas por estación
        for s_idx, st in enumerate(stations):
            y_t = y_test_real_35[:, s_idx]
            p_t = pred_test_real[:, s_idx]
            
            mae = np.mean(np.abs(y_t - p_t))
            rmse = np.sqrt(np.mean((y_t - p_t)**2))
            mape = np.mean(np.abs((y_t - p_t) / y_t)) * 100
            ss_res = np.sum((y_t - p_t)**2)
            ss_tot = np.sum((y_t - np.mean(y_t))**2)
            r2 = 1 - (ss_res / ss_tot) if ss_tot > 0 else 0

            print(f"[{m_name}] {st} -> MAE: {mae:.3f}, RMSE: {rmse:.3f}, MAPE: {mape:.2f}%, R2: {r2:.3f}")
            metrics_records.append({
                'Estación': st,
                'Modelo': m_name,
                'MAE': mae,
                'RMSE': rmse,
                'MAPE': mape,
                'R2': r2
            })
            dl_test_preds[f"{st}_{m_name}"] = p_t
            dl_forecast_preds[f"{st}_{m_name}"] = pred_fc_real[:, s_idx]

    df_dl_metrics = pd.DataFrame(metrics_records)
    df_dl_metrics.to_csv('datos-crudos/metrics_deep_learning.csv', index=False)
    pd.DataFrame(dl_test_preds).to_csv('datos-crudos/test_preds_deep_learning.csv', index=False)
    pd.DataFrame(dl_forecast_preds).to_csv('datos-crudos/forecast_35d_deep_learning.csv', index=False)

    print("\n=== RESUMEN MÉTRICAS DEEP LEARNING (35 DÍAS TEST) ===")
    print(df_dl_metrics.to_string(index=False))

    return df_dl_metrics

if __name__ == '__main__':
    train_and_eval_dl()
