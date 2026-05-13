# PostgreSQL Snake Case Naming

Srinil Stay stores application data in PostgreSQL, and all database identifiers should use database-native `snake_case`, including ASP.NET Core Identity tables and columns. This avoids quoted mixed-case identifiers and keeps SQL inspection, migrations, and manual database work idiomatic for PostgreSQL.
