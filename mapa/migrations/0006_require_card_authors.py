from django.db import migrations, models


def install_author_checks(apps, schema_editor):
    # Existing cards may have an unknown creator. Editing one still requires
    # a named editor and must not assign that person as the original creator.
    if schema_editor.connection.vendor == 'postgresql':
        schema_editor.execute("""
            CREATE FUNCTION mapa_require_card_authors() RETURNS trigger
            LANGUAGE plpgsql AS $$
            BEGIN
                IF NEW.updated_by !~ '[^[:space:]]' THEN
                    RAISE EXCEPTION 'updated_by is required' USING ERRCODE = '23514';
                END IF;
                IF NEW.created_by !~ '[^[:space:]]' THEN
                    IF TG_OP = 'INSERT' OR OLD.created_by ~ '[^[:space:]]' THEN
                        RAISE EXCEPTION 'created_by is required' USING ERRCODE = '23514';
                    END IF;
                END IF;
                RETURN NEW;
            END;
            $$
        """)
        schema_editor.execute("""
            CREATE TRIGGER mapa_card_authors BEFORE INSERT OR UPDATE ON mapa_mapcard
            FOR EACH ROW EXECUTE FUNCTION mapa_require_card_authors()
        """)
    elif schema_editor.connection.vendor == 'sqlite':
        whitespace = 'char(9, 10, 11, 12, 13, 32)'
        for operation in ('INSERT', 'UPDATE'):
            require_creator = f"trim(NEW.created_by, {whitespace}) = ''"
            if operation == 'UPDATE':
                require_creator += f" AND trim(OLD.created_by, {whitespace}) <> ''"
            schema_editor.execute(f"""
                CREATE TRIGGER mapa_card_authors_{operation} BEFORE {operation} ON mapa_mapcard
                WHEN trim(NEW.updated_by, {whitespace}) = '' OR ({require_creator})
                BEGIN
                    SELECT RAISE(ABORT, 'Card author is required');
                END
            """)


def remove_author_checks(apps, schema_editor):
    if schema_editor.connection.vendor == 'postgresql':
        schema_editor.execute('DROP TRIGGER mapa_card_authors ON mapa_mapcard')
        schema_editor.execute('DROP FUNCTION mapa_require_card_authors()')
    elif schema_editor.connection.vendor == 'sqlite':
        for operation in ('INSERT', 'UPDATE'):
            schema_editor.execute(f'DROP TRIGGER mapa_card_authors_{operation}')


class Migration(migrations.Migration):
    dependencies = [('mapa', '0005_backfill_card_history')]
    operations = [
        migrations.AlterField('mapcard', 'created_by', models.CharField(max_length=120)),
        migrations.AlterField('mapcard', 'updated_by', models.CharField(max_length=120)),
        migrations.RunPython(install_author_checks, remove_author_checks),
    ]
