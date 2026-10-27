import calendar
import os
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

def reconstruct_clean_dataset(excel_path='DATOS RIO ORINOCO.xlsx', 
                              output_csv='datos-crudos/orinoco_2009_2025_limpio.csv',
                              baseline_csv='datos-crudos/baseline_magic_target.csv'):
    """
    Reconstruye el dataset continuo 2009-01-01 a 2025-02-24 desde las 4 hojas matrices
    de DATOS RIO ORINOCO.xlsx, aplicando las correcciones especificadas en AGENTS.md.
    """
    station_sheets = {
        'Puerto Ayacucho': 'Puerto Ayacucho',
        'Caicara el mini mini': 'Caicara',
        'Ciudad Bolívar': 'Ciudad Bolivar',
        'Palúa': 'Palua'
    }
    
    # 1. Leer matrices
    dfs_matrix = {}
    for st_name, sname in station_sheets.items():
        df_sheet = pd.read_excel(excel_path, sheet_name=sname)
        dfs_matrix[st_name] = df_sheet

    # 2. Generar el rango de fechas continuo: 2009-01-01 a 2025-02-24 (5.899 días)
    dates = pd.date_range('2009-01-01', '2025-02-24', freq='D')
    print(f"Rango de fechas generado: {dates[0].strftime('%Y-%m-%d')} a {dates[-1].strftime('%Y-%m-%d')} ({len(dates)} días)")

    station_series = {}
    for st_name, df_sheet in dfs_matrix.items():
        vals = []
        for d in dates:
            year = d.year
            # Fila en la matriz:
            # En años bisiestos: día del año d.timetuple().tm_yday - 1 (1 a 366 -> 0 a 365)
            # En años no bisiestos:
            # Si es enero o febrero (d.month <= 2): día del año - 1 (0 a 58)
            # Si es marzo en adelante (d.month > 2): día del año (índice 60 para 1 de marzo, saltando la fila 59)
            is_leap = calendar.isleap(year)
            doy = d.timetuple().tm_yday  # 1-indexed
            if is_leap:
                row_idx = doy - 1
            else:
                if d.month <= 2:
                    row_idx = doy - 1
                else:
                    row_idx = doy  # Salta fila 59 (29 de febrero)
            
            val = df_sheet.loc[row_idx, year]
            # Limpiar posibles strings con espacios
            if isinstance(val, str):
                val = val.strip()
                val = float(val) if val != '' else np.nan
            vals.append(val)
        
        station_series[st_name] = pd.Series(vals, index=dates, dtype=float)

    df_clean = pd.DataFrame(station_series)
    df_clean.index.name = 'Fecha'
    df_clean = df_clean.reset_index()

    # 3. Aplicar correcciones específicas del Módulo 1:
    # a. Palúa (2021-10-29): Reemplazar salto irreal 9.79 por NaN e interpolar linealmente
    mask_palua_spike = (df_clean['Fecha'] == '2021-10-29')
    val_before = df_clean.loc[mask_palua_spike, 'Palúa'].values[0]
    print(f"Palúa valor en 2021-10-29 antes de corregir: {val_before}")
    df_clean.loc[mask_palua_spike, 'Palúa'] = np.nan
    df_clean['Palúa'] = df_clean['Palúa'].interpolate(method='linear')
    val_after = df_clean.loc[mask_palua_spike, 'Palúa'].values[0]
    print(f"Palúa valor en 2021-10-29 después de interpolar: {val_after:.4f}")

    # b. Ciudad Bolívar (2019-01-01 a 2019-01-10): Reemplazar escalón por NaN e interpolar entre 2018-12-31 y 2019-01-11
    mask_cb_block = (df_clean['Fecha'] >= '2019-01-01') & (df_clean['Fecha'] <= '2019-01-10')
    print(f"Ciudad Bolívar reemplazando {mask_cb_block.sum()} valores en bloque 2019-01-01 a 2019-01-10...")
    df_clean.loc[mask_cb_block, 'Ciudad Bolívar'] = np.nan
    df_clean['Ciudad Bolívar'] = df_clean['Ciudad Bolívar'].interpolate(method='linear')

    # c. Palúa: Imputar los 3 valores NaN de días bisiestos (2012-02-29, 2016-02-29, 2020-02-29) con interpolación lineal
    leap_days = ['2012-02-29', '2016-02-29', '2020-02-29']
    print("Palúa valores bisiestos antes de imputar:")
    for ld in leap_days:
        print(f"  {ld}: {df_clean.loc[df_clean['Fecha'] == ld, 'Palúa'].values[0]}")
    
    df_clean['Palúa'] = df_clean['Palúa'].interpolate(method='linear')
    print("Palúa valores bisiestos después de imputar:")
    for ld in leap_days:
        print(f"  {ld}: {df_clean.loc[df_clean['Fecha'] == ld, 'Palúa'].values[0]:.4f}")

    # d. Verificar Caicara en 2019-12-29
    val_caicara_check = df_clean.loc[df_clean['Fecha'] == '2019-12-29', 'Caicara el mini mini'].values[0]
    print(f"Caicara en 2019-12-29 (debe ser 25.91): {val_caicara_check}")

    # e. Verificar Ciudad Bolívar en 2020-01-01 (debe ser 7.34)
    val_cb_check = df_clean.loc[df_clean['Fecha'] == '2020-01-01', 'Ciudad Bolívar'].values[0]
    print(f"Ciudad Bolívar en 2020-01-01 (debe ser 7.34): {val_cb_check}")

    # f. Verificar que no quedan NaNs
    n_nans = df_clean.isna().sum().to_dict()
    print("Conteo final de NaNs en df_clean:", n_nans)
    assert df_clean.isna().sum().sum() == 0, "Existen valores NaN no resueltos en df_clean"

    # Guardar CSV limpio
    os.makedirs(os.path.dirname(output_csv), exist_ok=True)
    df_clean.to_csv(output_csv, index=False)
    print(f"Dataset limpio guardado exitosamente en: {output_csv} (filas: {len(df_clean)})")

    # 4. Extraer Baseline Magic (35 días ciegos: 2025-02-25 a 2025-03-31)
    df_entrenar = pd.read_excel(excel_path, sheet_name='Entrenar')
    df_baseline = df_entrenar[df_entrenar['Fecha'] >= '2025-02-25'].copy()
    baseline_cols = ['Fecha'] + [c for c in df_entrenar.columns if 'Pred:' in c]
    df_baseline = df_baseline[baseline_cols].reset_index(drop=True)
    df_baseline.to_csv(baseline_csv, index=False)
    print(f"Baseline Magic guardado en: {baseline_csv} (filas: {len(df_baseline)})")

    return df_clean, df_baseline

if __name__ == '__main__':
    reconstruct_clean_dataset()
