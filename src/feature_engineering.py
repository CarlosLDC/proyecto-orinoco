import os
import pandas as pd
import numpy as np

def build_features(clean_csv_path='datos-crudos/orinoco_2009_2025_limpio.csv',
                   output_dir='datos-crudos'):
    """
    Construye las características temporales cíclicas y rezagos (lags)
    temporales y espaciales respetando la prevención de fuga de datos.
    Divide el dataset en train, val y test.
    """
    df = pd.read_csv(clean_csv_path)
    df['Fecha'] = pd.to_datetime(df['Fecha'])
    df = df.sort_values('Fecha').reset_index(drop=True)

    # 1. Codificación Cíclica Anual
    doy = df['Fecha'].dt.dayofyear
    df['sin_doy'] = np.sin(2 * np.pi * doy / 365.25)
    df['cos_doy'] = np.cos(2 * np.pi * doy / 365.25)

    stations = ['Puerto Ayacucho', 'Caicara el mini mini', 'Ciudad Bolívar', 'Palúa']

    # 2. Lags autorregresivos propios de cada estación: t-1, t-2, t-7, t-14
    for st in stations:
        for lag in [1, 2, 7, 14]:
            col_name = f"{st}_lag_{lag}"
            df[col_name] = df[st].shift(lag)

    # 3. Lags de propagación aguas arriba:
    # Cotas de Puerto Ayacucho y Caicara en t-7, t-14 y t-17
    # Nota: t-7 y t-14 ya están creados arriba, agregamos t-17 para Puerto Ayacucho y Caicara
    for st in ['Puerto Ayacucho', 'Caicara el mini mini']:
        for lag in [17]:
            col_name = f"{st}_lag_{lag}"
            df[col_name] = df[st].shift(lag)

    # Guardar dataset con features completas
    full_features_path = os.path.join(output_dir, 'orinoco_features.csv')
    df.to_csv(full_features_path, index=False)
    print(f"Dataset con features creado: {full_features_path} (shape: {df.shape})")

    # 4. Partición Temporal Estricta
    # Train Set: 2009-01-01 a 2023-12-31
    # Val Set:   2024-01-01 a 2024-11-30
    # Test Set:  2024-12-01 a 2025-02-24
    df_train = df[(df['Fecha'] >= '2009-01-01') & (df['Fecha'] <= '2023-12-31')].copy()
    df_val   = df[(df['Fecha'] >= '2024-01-01') & (df['Fecha'] <= '2024-11-30')].copy()
    df_test  = df[(df['Fecha'] >= '2024-12-01') & (df['Fecha'] <= '2025-02-24')].copy()

    print(f"Train split: {df_train['Fecha'].min().strftime('%Y-%m-%d')} a {df_train['Fecha'].max().strftime('%Y-%m-%d')} ({len(df_train)} días)")
    print(f"Val split:   {df_val['Fecha'].min().strftime('%Y-%m-%d')} a {df_val['Fecha'].max().strftime('%Y-%m-%d')} ({len(df_val)} días)")
    print(f"Test split:  {df_test['Fecha'].min().strftime('%Y-%m-%d')} a {df_test['Fecha'].max().strftime('%Y-%m-%d')} ({len(df_test)} días)")

    df_train.to_csv(os.path.join(output_dir, 'split_train.csv'), index=False)
    df_val.to_csv(os.path.join(output_dir, 'split_val.csv'), index=False)
    df_test.to_csv(os.path.join(output_dir, 'split_test.csv'), index=False)
    print("Particiones temporales guardadas exitosamente.")

    return df_train, df_val, df_test

if __name__ == '__main__':
    build_features()
