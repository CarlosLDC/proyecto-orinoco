import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

def analyze_cross_correlation(csv_path='datos-crudos/orinoco_2009_2025_limpio.csv',
                              output_dir='notebooks/eda_results'):
    """
    Calcula y grafica la correlación cruzada entre las estaciones
    (tanto en niveles como en primeras diferencias Delta y_t) para demostrar empíricamente
    los retardos físicos de 7, 14 y 17 días entre aguas arriba y aguas abajo.
    """
    os.makedirs(output_dir, exist_ok=True)
    df = pd.read_csv(csv_path)
    df['Fecha'] = pd.to_datetime(df['Fecha'])
    df = df.sort_values('Fecha').reset_index(drop=True)

    stations = ['Puerto Ayacucho', 'Caicara el mini mini', 'Ciudad Bolívar', 'Palúa']
    
    # 1. Primeras diferencias diarias para remover tendencia / no-estacionariedad anual y aislar ondas
    df_diff = df[stations].diff().dropna()

    max_lag = 35
    lags = np.arange(0, max_lag + 1)

    # Pairs to evaluate: Puerto Ayacucho -> Caicara, Puerto Ayacucho -> Ciudad Bolívar, Puerto Ayacucho -> Palúa, Caicara -> Ciudad Bolívar, Caicara -> Palúa
    pairs = [
        ('Puerto Ayacucho', 'Caicara el mini mini', 'Puerto Ayacucho -> Caicara'),
        ('Puerto Ayacucho', 'Ciudad Bolívar', 'Puerto Ayacucho -> Ciudad Bolívar'),
        ('Puerto Ayacucho', 'Palúa', 'Puerto Ayacucho -> Palúa'),
        ('Caicara el mini mini', 'Ciudad Bolívar', 'Caicara -> Ciudad Bolívar'),
        ('Caicara el mini mini', 'Palúa', 'Caicara -> Palúa'),
        ('Ciudad Bolívar', 'Palúa', 'Ciudad Bolívar -> Palúa'),
    ]

    fig, axes = plt.subplots(len(pairs), 2, figsize=(14, 3 * len(pairs)), sharex=True)
    fig.suptitle('Análisis de Retardos Hidrodinámicos (Correlación Cruzada entre Estaciones)', fontsize=15, y=0.99)

    summary_records = []

    for idx, (up_st, down_st, label) in enumerate(pairs):
        corr_levels = []
        corr_diffs = []
        
        # y_down(t) con y_up(t - lag)
        for lag in lags:
            if lag == 0:
                c_lvl = df[down_st].corr(df[up_st])
                c_dif = df_diff[down_st].corr(df_diff[up_st])
            else:
                c_lvl = df[down_st].iloc[lag:].corr(df[up_st].iloc[:-lag])
                c_dif = df_diff[down_st].iloc[lag:].corr(df_diff[up_st].iloc[:-lag])
            corr_levels.append(c_lvl)
            corr_diffs.append(c_dif)
        
        best_lag_lvl = lags[np.argmax(corr_levels)]
        best_lag_dif = lags[np.argmax(corr_diffs)]
        max_c_dif = np.max(corr_diffs)
        
        summary_records.append({
            'Par': label,
            'Mejor Lag (Nivel)': best_lag_lvl,
            'Correlación Máx (Nivel)': np.max(corr_levels),
            'Mejor Lag (Diferencias Delta y)': best_lag_dif,
            'Correlación Máx (Diferencias)': max_c_dif
        })

        # Gráfico en niveles
        ax_lvl = axes[idx, 0]
        ax_lvl.plot(lags, corr_levels, marker='o', color='tab:blue', markersize=3)
        ax_lvl.axvline(best_lag_lvl, color='red', linestyle='--', alpha=0.7, label=f'Peak: lag {best_lag_lvl}')
        ax_lvl.set_ylabel('Corr(Niveles)')
        ax_lvl.set_title(f'{label} (Niveles)', fontsize=10)
        ax_lvl.grid(True, alpha=0.3)
        ax_lvl.legend(loc='lower right', fontsize=8)

        # Gráfico en diferencias
        ax_dif = axes[idx, 1]
        ax_dif.plot(lags, corr_diffs, marker='s', color='tab:green', markersize=3)
        ax_dif.axvline(best_lag_dif, color='red', linestyle='--', alpha=0.7, label=f'Peak: lag {best_lag_dif}')
        # Highlight reference lags (7, 14, 17)
        for ref_l in [7, 14, 17]:
            ax_dif.axvline(ref_l, color='orange', linestyle=':', alpha=0.5)
        ax_dif.set_ylabel('Corr(Δ Cota diaria)')
        ax_dif.set_title(f'{label} (Primeras Diferencias)', fontsize=10)
        ax_dif.grid(True, alpha=0.3)
        ax_dif.legend(loc='upper right', fontsize=8)

    axes[-1, 0].set_xlabel('Lag temporal k (días hacia atrás)')
    axes[-1, 1].set_xlabel('Lag temporal k (días hacia atrás)')

    plt.tight_layout()
    chart_path = os.path.join(output_dir, 'cross_correlation_analysis.png')
    plt.savefig(chart_path, dpi=200)
    plt.close()

    df_summary = pd.DataFrame(summary_records)
    print("\n=== RESUMEN EMPÍRICO DE RETARDOS HIDRODINÁMICOS ===")
    print(df_summary.to_string(index=False))
    print(f"\nGráfico guardado en: {chart_path}")

    return df_summary

if __name__ == '__main__':
    analyze_cross_correlation()
