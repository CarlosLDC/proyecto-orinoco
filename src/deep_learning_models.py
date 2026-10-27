import os
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
import joblib

class MultiStepRiverDataset(Dataset):
    def __init__(self, X, y, lookback=60, horizon=35):
        self.lookback = lookback
        self.horizon = horizon
        self.samples = []
        for i in range(len(X) - lookback - horizon + 1):
            x_seq = X[i : i + lookback]
            y_seq = y[i + lookback : i + lookback + horizon]
            self.samples.append((x_seq, y_seq))

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        x, y = self.samples[idx]
        return torch.tensor(x, dtype=torch.float32), torch.tensor(y, dtype=torch.float32)

# 1. Arquitectura LSTM Multi-Output
class RiverLSTM(nn.Module):
    def __init__(self, input_dim, hidden_dim=64, num_layers=2, horizon=35, output_stations=4, dropout=0.2):
        super(RiverLSTM, self).__init__()
        self.horizon = horizon
        self.output_stations = output_stations
        self.lstm = nn.LSTM(
            input_size=input_dim,
            hidden_size=hidden_dim,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0.0
        )
        self.fc = nn.Sequential(
            nn.Linear(hidden_dim, 128),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(128, horizon * output_stations)
        )

    def forward(self, x):
        out, (h_n, c_n) = self.lstm(x)
        # Tomar la última salida temporal del contexto histórico
        last_out = out[:, -1, :] # [batch, hidden_dim]
        preds = self.fc(last_out) # [batch, horizon * output_stations]
        preds = preds.view(-1, self.horizon, self.output_stations)
        return preds

# 2. Arquitectura Bi-LSTM Multi-Output
class RiverBiLSTM(nn.Module):
    def __init__(self, input_dim, hidden_dim=64, num_layers=2, horizon=35, output_stations=4, dropout=0.2):
        super(RiverBiLSTM, self).__init__()
        self.horizon = horizon
        self.output_stations = output_stations
        self.bilstm = nn.LSTM(
            input_size=input_dim,
            hidden_size=hidden_dim,
            num_layers=num_layers,
            batch_first=True,
            bidirectional=True,
            dropout=dropout if num_layers > 1 else 0.0
        )
        self.fc = nn.Sequential(
            nn.Linear(hidden_dim * 2, 128),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(128, horizon * output_stations)
        )

    def forward(self, x):
        out, (h_n, c_n) = self.bilstm(x)
        last_out = out[:, -1, :] # [batch, hidden_dim * 2]
        preds = self.fc(last_out)
        preds = preds.view(-1, self.horizon, self.output_stations)
        return preds

# 3. Arquitectura Transformer Multi-Output
class PositionalEncoding(nn.Module):
    def __init__(self, d_model, max_len=500):
        super(PositionalEncoding, self).__init__()
        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(torch.arange(0, d_model, 2).float() * (-np.log(10000.0) / d_model))
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        self.register_buffer('pe', pe.unsqueeze(0))

    def forward(self, x):
        # x: [batch, seq_len, d_model]
        return x + self.pe[:, :x.size(1), :]

class RiverTransformer(nn.Module):
    def __init__(self, input_dim, d_model=64, nhead=4, num_encoder_layers=2, dim_feedforward=128, horizon=35, output_stations=4, dropout=0.1):
        super(RiverTransformer, self).__init__()
        self.horizon = horizon
        self.output_stations = output_stations
        self.input_proj = nn.Linear(input_dim, d_model)
        self.pos_encoder = PositionalEncoding(d_model)
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model,
            nhead=nhead,
            dim_feedforward=dim_feedforward,
            dropout=dropout,
            batch_first=True
        )
        self.transformer_encoder = nn.TransformerEncoder(encoder_layer, num_layers=num_encoder_layers)
        self.fc = nn.Sequential(
            nn.Linear(d_model, 128),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(128, horizon * output_stations)
        )

    def forward(self, x):
        x_proj = self.input_proj(x)
        x_pos = self.pos_encoder(x_proj)
        encoded = self.transformer_encoder(x_pos)
        # Pooling o último paso
        last_step = encoded[:, -1, :]
        preds = self.fc(last_step)
        preds = preds.view(-1, self.horizon, self.output_stations)
        return preds
