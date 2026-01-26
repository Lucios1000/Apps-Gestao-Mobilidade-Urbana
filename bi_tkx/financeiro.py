from __future__ import annotations

from .db import get_connection


def exibir_resumo_mensal(db_path: str = "tkx_franca.db") -> None:
    try:
        conn = get_connection(db_path)
        cursor = conn.cursor()

        query = """
        SELECT 
            COUNT(id) as total_viagens,
            SUM(valor_total_pago) as faturamento_bruto,
            SUM(taxa_app_valor) as comissao_tkx,
            SUM(custo_gateway) as gateway,
            SUM(custos_fixos_totais) as operacao
        FROM historico_corridas;
        """

        cursor.execute(query)
        dados = cursor.fetchone()

        print("\n================================")
        print("      SISTEMA DE GESTÃO TKX     ")
        print("================================")

        total = dados[0] if dados[0] else 0
        bruto = dados[1] if dados[1] else 0.0
        comissao = dados[2] if dados[2] else 0.0
        gate = dados[3] if dados[3] else 0.0
        oper = dados[4] if dados[4] else 0.0

        if total == 0:
            print("Status: Banco conectado.")
            print("Aviso: Nenhuma corrida registrada ainda no sistema.")
        else:
            lucro_liquido = comissao - gate - oper

            print(f"Total de Corridas: {total}")
            print(f"Faturamento Bruto: R$ {bruto:.2f}")
            print(f"Sua Comissão (15%): R$ {comissao:.2f}")
            print(f"--------------------------------")
            print(f"(-) Custo Gateway: R$ {gate:.2f}")
            print(f"(-) Custos Fixos:  R$ {oper:.2f}")
            print(f"--------------------------------")
            print(f"LUCRO LÍQUIDO REAL: R$ {lucro_liquido:.2f}")

        print("================================\n")
        conn.close()
    except Exception as e:
        print(f"Erro ao acessar o banco: {e}")


def resumo_financeiro_texto(db_path: str = "tkx_franca.db") -> str:
    conn = get_connection(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT SUM(valor_total_pago), SUM(taxa_app_valor) FROM historico_corridas")
    res = cursor.fetchone()
    bruto = res[0] or 0
    lucro = res[1] or 0
    conn.close()
    return f"FATURAMENTO BRUTO: R$ {bruto:.2f}\nLUCRO TKX (15%): R$ {lucro:.2f}\nSTATUS: OPERACIONAL"
