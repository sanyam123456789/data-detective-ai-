"""
Phase 2D — SQLite Database Migration Script
--------------------------------------------
Adds Phase 2D pipeline columns to existing SQLite app.db if not present.
Safe and idempotent.
"""
import os
import sqlite3

def run_migration():
    db_path = os.path.join(os.path.dirname(__file__), "app.db")
    if not os.path.exists(db_path):
        print(f"No existing app.db found at {db_path}. Tables will be created automatically on startup.")
        return

    print(f"Running Phase 2D SQLite migration on: {db_path}")
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    cols_to_add = [
        ("pipeline_status", "TEXT DEFAULT 'LOCAL'"),
        ("raw_s3_key", "TEXT"),
        ("curated_s3_key", "TEXT"),
        ("catalog_database", "TEXT"),
        ("catalog_table", "TEXT"),
        ("pipeline_error", "TEXT"),
        ("processed_at", "TIMESTAMP"),
    ]

    existing = [row[1] for row in cur.execute("PRAGMA table_info(datasets)").fetchall()]

    for col_name, col_def in cols_to_add:
        if col_name not in existing:
            cur.execute(f"ALTER TABLE datasets ADD COLUMN {col_name} {col_def}")
            print(f"  + Added column: {col_name}")
        else:
            print(f"  = Already exists: {col_name}")

    conn.commit()
    conn.close()
    print("Migration complete!")

if __name__ == "__main__":
    run_migration()
