# Comparativa Global de Modelos (Test Set - 35 días)

| Estación             | Modelo      |      MAE |     RMSE |      MAPE |        R2 |
|:---------------------|:------------|---------:|---------:|----------:|----------:|
| Caicara el mini mini | Transformer | 0.309012 | 0.355674 |  1.2293   |  0.836227 |
| Caicara el mini mini | LSTM        | 0.277165 | 0.365859 |  1.08774  |  0.826712 |
| Caicara el mini mini | Bi-LSTM     | 0.275609 | 0.392247 |  1.09162  |  0.800813 |
| Caicara el mini mini | ARIMAX      | 0.987755 | 1.10059  |  3.94953  | -0.568168 |
| Caicara el mini mini | TimesFM     | 1.01656  | 1.13529  |  4.06649  | -0.6686   |
| Caicara el mini mini | AutoARIMA   | 2.43155  | 2.76254  |  9.75235  | -8.87998  |
| Ciudad Bolívar       | Bi-LSTM     | 0.191365 | 0.247666 |  2.76176  |  0.930714 |
| Ciudad Bolívar       | ARIMAX      | 0.224808 | 0.253026 |  3.26057  |  0.927683 |
| Ciudad Bolívar       | LSTM        | 0.218289 | 0.26759  |  3.02813  |  0.919118 |
| Ciudad Bolívar       | Transformer | 0.299803 | 0.336765 |  4.32799  |  0.871895 |
| Ciudad Bolívar       | TimesFM     | 0.707754 | 0.844454 | 10.9826   |  0.194502 |
| Ciudad Bolívar       | AutoARIMA   | 1.70046  | 2.11758  | 26.7529   | -4.06515  |
| Palúa                | ARIMAX      | 0.153192 | 0.177852 |  4.6506   |  0.922543 |
| Palúa                | LSTM        | 0.153851 | 0.195377 |  5.15837  |  0.906526 |
| Palúa                | Bi-LSTM     | 0.254793 | 0.286114 |  7.88357  |  0.799544 |
| Palúa                | TimesFM     | 0.316694 | 0.365769 | 10.5075   |  0.672392 |
| Palúa                | Transformer | 0.347869 | 0.424232 | 12.0564   |  0.559294 |
| Palúa                | AutoARIMA   | 1.02778  | 1.25859  | 36.084    | -2.87891  |
| Puerto Ayacucho      | Transformer | 0.327855 | 0.412924 |  0.755377 |  0.553759 |
| Puerto Ayacucho      | LSTM        | 0.348603 | 0.507937 |  0.799651 |  0.324774 |
| Puerto Ayacucho      | Bi-LSTM     | 0.334747 | 0.531398 |  0.769655 |  0.260958 |
| Puerto Ayacucho      | ARIMAX      | 0.456659 | 0.538414 |  1.05473  |  0.241313 |
| Puerto Ayacucho      | TimesFM     | 0.676989 | 0.814823 |  1.56689  | -0.737625 |
| Puerto Ayacucho      | AutoARIMA   | 1.5294   | 1.73642  |  3.53641  | -6.89114  |