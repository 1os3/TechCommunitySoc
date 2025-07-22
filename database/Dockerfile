FROM postgres:15-alpine

# Copy initialization scripts
COPY init-db.sql /docker-entrypoint-initdb.d/

# Set environment variables
ENV POSTGRES_DB=forum_db
ENV POSTGRES_USER=forum_user
ENV POSTGRES_PASSWORD=forum_password

# Expose PostgreSQL port
EXPOSE 5432