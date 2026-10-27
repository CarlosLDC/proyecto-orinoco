import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

def evaluate_and_visualize_all(output_dir='notebooks/evaluation_results'):
    """
    Consolida las métricas de todos los modelos (AutoARIMA, ARIMAX, LSTM, Bi-LSTM, Transformer, TimesFM),
    genera la tabla comparativa global y produce los gráficos comparativos finales
    del tramo de test y del horizonte a ciegas (2025-02-25 a 2025-03-31) junto al baseline Simple-ML (Magic).
    """
    os.makedirs(output_dir, exist_ok=True)

    # 1. Cargar métricas de test
    m_arima = pd.read_csv('datos-crudos/metrics_arima_sarimax.csv')
    m_dl = pd.read_csv('datos-crudos/metrics_deep_learning.csv')
    m_tfm = pd.read_csv('datos-crudos/metrics_timesfm.csv')

    df_metrics = pd.concat([m_arima, m_dl, m_tfm], ignore_index=True)
    df_metrics = df_metrics.sort_values(by=['Estación', 'RMSE']).reset_index(drop=True)
    
    table_csv = os.path.join(output_dir, 'tabla_comparativa_global_metricas.csv')
    df_metrics.to_csv(table_csv, index=False)
    print("\n=================== TABLA COMPARATIVA GLOBAL DE MÉTRICAS (TEST 35 DÍAS) ===================")
    print(df_metrics.to_string(index=False))

    # Guardar versión Markdown
    table_md = os.path.join(output_dir, 'tabla_comparativa_global_metricas.md')
    with open(table_md, 'w', encoding='utf-8') as f:
        f.write("# Comparativa Global de Modelos (Test Set - 35 días)\n\n")
        f.write(df_metrics.to_markdown(index=False))

    # 2. Cargar predicciones del horizonte a ciegas (35 días: 2025-02-25 a 2025-03-31)
    fc_arima = pd.read_csv('datos-crudos/forecast_35d_arima.csv')
    fc_dl = pd.read_csv('datos-crudos/forecast_35d_deep_learning.csv')
    fc_tfm = pd.read_csv('datos-crudos/forecast_35d_timesfm.csv')
    fc_magic = pd.read_csv('datos-crudos/baseline_magic_target.csv')

    for df in [fc_arima, fc_dl, fc_tfm, fc_magic]:
        df['Fecha'] = pd.to_datetime(df['Fecha'])

    # Combinar todas las predicciones del horizonte futuro en un único DataFrame
    df_fc_combined = fc_arima.merge(fc_dl, on='Fecha').merge(fc_tfm, on='Fecha')
    
    # Mapeo de columnas de baseline Magic
    magic_mapping = {
        'Puerto Ayacucho': 'Pred:Puerto Ayacucho',
        'Caicara el mini mini': 'Pred:Caicara el mini mini',
        'Ciudad Bolívar': 'Pred:Ciudad Bolívar',
        'Palúa': 'Pred:Palúa'
    }

    for st, col in magic_mapping.items():
        if col in fc_magic.columns:
            df_fc_combined[f"{st}_SimpleML_Magic"] = fc_magic[col].values

    df_fc_combined.to_csv(os.path.join(output_dir, 'proyecciones_35d_todos_los_modelos.csv'), index=False)

    # 3. Cargar datos históricos recientes para contexto visual (últimos 45 días de datos reales)
    df_clean = pd.read_csv('datos-crudos/orinoco_2009_2025_limpio.csv')
    df_clean['Fecha'] = pd.to_datetime(df_clean['Fecha'])
    recent_history = df_clean.iloc[-45:].copy()

    # 4. Generar visualización por estación
    stations = ['Puerto Ayacucho', 'Caicara el mini mini', 'Ciudad Bolívar', 'Palúa']
    fig, axes = plt.subplots(4, 1, figsize=(15, 18), sharex=False)
    fig.suptitle('Predicción Hidrométrica del Río Orinoco (Horizonte a Ciegas: 25-Feb-2025 a 31-Mar-2025)', fontsize=16, y=0.995)

    colors = {
        'AutoARIMA': 'tab:gray',
        'ARIMAX': 'tab:blue',
        'LSTM': 'tab:orange',
        'Bi-LSTM': 'tab:green',
        'Transformer': 'tab:purple',
        'TimesFM': 'tab:cyan',
        'SimpleML_Magic': 'tab:red'
    }

    for idx, st in enumerate(stations):
        ax = axes[idx]
        
        # Histórico real reciente
        ax.plot(recent_history['Fecha'], recent_history[st], color='black', linewidth=2.0, label='Histórico Real Observado')
        
        # Conexión continua con el último punto real
        last_date = recent_history['Fecha'].iloc[-1]
        last_val = recent_history[st].iloc[-1]

        # Modelos proyectados
        model_names = ['AutoARIMA', 'ARIMAX', 'LSTM', 'Bi-LSTM', 'Transformer', 'TimesFM', 'SimpleML_Magic']
        for m in model_names:
            col_name = f"{st}_{m}"
            if col_name in df_fc_combined.columns:
                fc_x = [last_date] + list(df_fc_combined['Fecha'])
                fc_y = [last_val] + list(df_fc_combined[col_name])
                
                ls = '--' if 'Magic' in m else ('-.' if 'AutoARIMA' in m else '-')
                lw = 2.0 if m in ['ARIMAX', 'Bi-LSTM', 'SimpleML_Magic'] else 1.4
                ax.plot(fc_x, fc_y, label=m, color=colors.get(m, 'black'), linestyle=ls, linewidth=lw, alpha=0.9)

        ax.axvline(last_date, color='black', linestyle=':', alpha=0.6, label='Inicio Predicción (25-Feb-2025)')
        ax.set_title(f'Estación {idx+1}: {st} (Cota m s. n. m.)', fontsize=12, fontweight='bold')
        ax.set_ylabel('Cota (m s. n. m.)')
        ax.grid(True, alpha=0.3)
        ax.legend(loc='best', fontsize=8, ncol=4)

    plt.tight_layout()
    chart_path = os.path.join(output_dir, 'comparativa_final_predicciones_35d.png')
    plt.savefig(chart_path, dpi=200)
    plt.close()
    print(f"\nGráfico comparativo final generado exitosamente en: {chart_path}")

    # 5. Generar gráfico comparativo de evaluación en Test Set
    df_test_arima = pd.read_csv('datos-crudos/test_preds_arima.csv')
    df_test_dl = pd.read_csv('datos-crudos/test_preds_deep_learning.csv')
    df_test_tfm = pd.read_csv('datos-crudos/test_preds_timesfm.csv')

    for df in [df_test_arima, df_test_dl, df_test_tfm]:
        df['Fecha'] = pd.to_datetime(df['Fecha'])

    df_test_comb = df_test_arima.merge(df_test_dl, on='Fecha').merge(df_test_tfm, on='Fecha')
    
    fig_t, axes_t = plt.subplots(4, 1, figsize=(15, 18), sharex=True)
    fig_t.suptitle('Evaluación en Test Set (Primeros 35 Días: 01-Dic-2024 a 04-Ene-2025)', fontsize=16, y=0.995)

    for idx, st in enumerate(stations):
        ax = axes_t[idx]
        ax.plot(df_test_comb['Fecha'], df_test_comb[f"{st}_Real"], color='black', linewidth=2.2, label='Observado Real')
        for m in ['AutoARIMA', 'ARIMAX', 'LSTM', 'Bi-LSTM', 'Transformer', 'TimesFM']:
            cname = f"{st}_{m}"
            if cname in df_test_comb.columns:
                ls = '-.' if m == 'AutoARIMA' else '-'
                lw = 1.8 if m in ['ARIMAX', 'Bi-LSTM', 'Transformer'] else 1.3
                ax.plot(df_test_comb['Fecha'], df_test_comb[cname], label=m, color=colors[m], linestyle=ls, linewidth=lw)
        
        ax.set_title(f'Estación {idx+1}: {st} (Test Set 35 días)', fontsize=12, fontweight='bold')
        ax.set_ylabel('Cota (m s. n. m.)')
        ax.grid(True, alpha=0.3)
        ax.legend(loc='best', fontsize=8, ncol=4)

    plt.tight_layout()
    chart_test_path = os.path.join(output_dir, 'evaluacion_test_set_modelos.png')
    plt.savefig(chart_test_path, dpi=200)
    plt.close()
    print(f"Gráfico de evaluación en test set generado en: {chart_test_path}")

    return df_metrics

if __name__ == '__main__':
    evaluate_and_visualize_all()
