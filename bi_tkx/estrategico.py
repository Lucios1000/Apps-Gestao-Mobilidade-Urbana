from __future__ import annotations

from .db import get_connection


def gerar_texto_estrategico(db_path: str = "tkx_franca.db") -> str:
    conn = get_connection(db_path)
    cursor = conn.cursor()

    linhas: list[str] = []

    cursor.execute(
        "SELECT AVG(valor_total_pago), AVG(preco_concorrente) FROM historico_corridas WHERE preco_concorrente IS NOT NULL"
    )
    precos = cursor.fetchone()
    if precos and precos[0] and precos[1]:
        diff = ((precos[0] / precos[1]) - 1) * 100
        status = "MAIS CARO" if diff > 0 else "MAIS BARATO"
        linhas.append(f"📊 MERCADO: {abs(diff):.1f}% {status} que a concorrência")
    else:
        linhas.append("📊 MERCADO: Dados insuficientes para comparar.")

    linhas.append("")
    linhas.append("💎 CORRIDAS COM MAIOR LUCRATIVIDADE:")
    cursor.execute(
        "SELECT id, (taxa_app_valor - custo_gateway - custos_fixos_totais) as lucro FROM historico_corridas ORDER BY lucro DESC LIMIT 5"
    )
    for id_c, lucro in cursor.fetchall():
        linhas.append(f"Corrida #{id_c} | Lucro TKX: R$ {lucro:.2f}")

    linhas.append("")
    linhas.append("👥 CLIENTES MAIS FIÉIS (Top 3):")
    try:
        cursor.execute(
            """
            SELECT c.nome, COUNT(h.id)
            FROM clientes_cadastro c
            JOIN historico_corridas h ON c.id = h.cliente_id
            GROUP BY c.nome
            ORDER BY COUNT(h.id) DESC LIMIT 3
            """
        )
        clientes = cursor.fetchall()
        if not clientes:
            linhas.append("Nenhum dado de cliente fiel encontrado ainda.")
        for nome, total in clientes:
            linhas.append(f"Passageiro: {nome} | Viagens: {total}")
    except Exception:
        linhas.append("Aviso: Tabela de clientes ainda não populada ou vinculada.")

    conn.close()
    return "\n".join(linhas)


def bi_estrategico(db_path: str = "tkx_franca.db") -> None:
    print("\n" + "📈" * 25)
    print("      RX FINANCEIRO E COMPARATIVO DE MERCADO")
    print("📈" * 25)
    print(gerar_texto_estrategico(db_path))
