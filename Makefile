.PHONY: infra-up infra-down

infra-up:
	docker compose up -d --wait

infra-down:
	docker compose down
