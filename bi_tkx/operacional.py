from __future__ import annotations

from .db import get_connection


def gerar_texto_operacional_turno(inicio: str, fim: str, turno_nome: str, db_path: str = "tkx_franca.db") -> str:
    conn = get_connection(db_path)
    cursor = conn.cursor()

    linhas: list[str] = []
    linhas.append(f"🏆 TOP 10 DRIVERS - TURNO {turno_nome} ({inicio}h às {fim}h):")

    query = """
            SELECT m.nome, COUNT(h.id), SUM(h.taxa_app_valor)
            FROM motoristas_cadastro m
            JOIN historico_corridas h ON m.id = h.motorista_id
            WHERE h.hora_partida BETWEEN ? AND ?
            GROUP BY m.nome
            ORDER BY SUM(h.taxa_app_valor) DESC LIMIT 10
        """
    cursor.execute(query, (inicio, fim))
    for i, (nome, qtd, valor) in enumerate(cursor.fetchall(), 1):
        linhas.append(f"{i:2d}º | {nome[:15]:<15} | Corridas: {qtd:3d} | Lucro TKX: R$ {valor:.2f}")

    conn.close()
    return "\n".join(linhas)


def nota_media_frota(db_path: str = "tkx_franca.db") -> float:
    conn = get_connection(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT AVG(avaliacao_motorista) FROM historico_corridas")
    nota = cursor.fetchone()[0] or 0
    conn.close()
    return float(nota)


def bi_operacional(db_path: str = "tkx_franca.db") -> None:
    print("\n" + "█" * 50)
    print("      📊 BI OPERACIONAL - PERFORMANCE TKX")
    print("█" * 50)

    print("\n" + gerar_texto_operacional_turno("06:00", "18:00", "DIURNO", db_path))
    print("\n" + gerar_texto_operacional_turno("18:01", "05:59", "NOTURNO", db_path))

    print("\n" + "-" * 50)
    print("⭐ MÉTRICAS DE QUALIDADE E RETENÇÃO:")
    print(f"Nota Média da Frota: {nota_media_frota(db_path):.1f} / 5.0")
