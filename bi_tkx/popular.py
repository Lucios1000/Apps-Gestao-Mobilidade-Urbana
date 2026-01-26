import random
from datetime import datetime, timedelta

from .db import get_connection


def popular_banco(qtd: int = 100, db_path: str = "tkx_franca.db") -> None:
    conn = get_connection(db_path)
    cursor = conn.cursor()

    print(f"⏳ Gerando {qtd} corridas de teste para o BI... Aguarde.")

    for _ in range(qtd):
        dias_atras = random.randint(0, 30)
        hora = random.randint(0, 23)
        minuto = random.randint(0, 59)
        _data_hora = datetime.now() - timedelta(days=dias_atras)
        hora_str = f"{hora:02d}:{minuto:02d}"

        km = round(random.uniform(2.0, 25.0), 1)
        valor_base = 5.0 + (km * 2.5)

        multiplicador = 1.0
        if 6 <= hora < 11:
            multiplicador = 1.0
        elif 20 <= hora <= 23:
            multiplicador = 1.2
        elif 0 <= hora <= 5:
            multiplicador = 1.4

        valor_total = round(valor_base * multiplicador, 2)
        taxa_app = round(valor_total * 0.15, 2)
        gateway = 0.80
        fixo = 1.35

        preco_concorrente = round(valor_total * random.uniform(0.9, 1.15), 2)
        avaliacao = random.randint(3, 5)

        cursor.execute(
            """
            INSERT INTO historico_corridas 
            (motorista_id, cliente_id, valor_total_pago, km_distancia, taxa_app_valor, 
             custo_gateway, custos_fixos_totais, hora_partida, preco_concorrente, avaliacao_motorista)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
            (1, 1, valor_total, km, taxa_app, gateway, fixo, hora_str, preco_concorrente, avaliacao),
        )

    conn.commit()
    conn.close()
    print("✅ Sucesso! Corridas inseridas. Agora teste as opções 7 e 8 no Menu Principal.")
