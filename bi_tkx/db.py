import sqlite3


def get_connection(db_path: str = "tkx_franca.db") -> sqlite3.Connection:
    return sqlite3.connect(db_path)
