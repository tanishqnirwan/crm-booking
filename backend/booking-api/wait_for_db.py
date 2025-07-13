import time
import sys
import psycopg2
from psycopg2 import OperationalError
import os

def wait_for_db():
    db_url = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@db:5432/booking')
    for _ in range(30):
        try:
            conn = psycopg2.connect(db_url)
            conn.close()
            print('Database is ready!')
            return
        except OperationalError:
            print('Waiting for database to be ready...')
            time.sleep(2)
    print('Database not available after waiting, exiting.')
    sys.exit(1)

if __name__ == '__main__':
    wait_for_db() 