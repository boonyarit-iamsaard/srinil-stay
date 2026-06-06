.PHONY: infra-up infra-down up down

infra-up:
	docker compose -f compose.yaml up -d --wait

infra-down:
	docker compose -f compose.yaml down

up:
	docker compose -f compose.yaml -f compose.override.yaml up -d --build --wait

down:
	docker compose -f compose.yaml -f compose.override.yaml down
