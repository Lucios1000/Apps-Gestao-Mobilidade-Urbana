from __future__ import annotations

from .db import get_connection


def gerar_extrato_motorista(motorista_id, db_path: str = "tkx_franca.db") -> None:
    conn = get_connection(db_path)
    cursor = conn.cursor()

    cursor.execute("SELECT nome, placa FROM motoristas_cadastro WHERE id = ?", (motorista_id,))
    motorista = cursor.fetchone()

    if not motorista:
        print(f"\n❌ Motorista com ID {motorista_id} não encontrado.")
        conn.close()
        return

    nome, placa = motorista

    cursor.execute(
        """
        SELECT valor_total_pago, taxa_app_valor, data_cadastro
        FROM historico_corridas 
        WHERE motorista_id = ?
        """,
        (motorista_id,),
    )

    corridas = cursor.fetchall()

    print("\n" + "=" * 45)
    print("      EXTRATO DE REPASSE - TKX FRANCA")
    print("=" * 45)
    print(f"MOTORISTA: {nome}")
    print(f"VEÍCULO:   {placa}")
    print("-" * 45)

    total_repasse = 0

    if not corridas:
        print("Aviso: Nenhuma corrida vinculada a este ID ainda.")
    else:
        for c in corridas:
            valor_pago, taxa_tkx, data = c
            valor_motorista = valor_pago - taxa_tkx
            total_repasse += valor_motorista
            print(f"{data} | Total: R$ {valor_pago:>6.2f} | Seu: R$ {valor_motorista:>6.2f}")

    print("-" * 45)
    print(f"VALOR TOTAL A REPASSAR:     R$ {total_repasse:.2f}")
    print("=" * 45 + "\n")

    conn.close()
