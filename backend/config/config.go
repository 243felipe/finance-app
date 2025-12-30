package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DatabaseURL string
	JWTSecret   string
	Port        string
}

func Load() Config {
	// Detecta o ambiente: se GO_ENV ou ENV estiver definido como "production" ou "prod", usa .env.prod
	env := os.Getenv("GO_ENV")
	if env == "" {
		env = os.Getenv("ENV")
	}

	isProduction := env == "production" || env == "prod"
	var envFile string

	if isProduction {
		envFile = ".env.prod"
		log.Println("Ambiente: PRODUÇÃO - Carregando variáveis de ambiente (arquivo .env.prod opcional)")
	} else {
		envFile = ".env"
		log.Println("Ambiente: DESENVOLVIMENTO - Carregando variáveis de ambiente do arquivo .env")
	}

	// Tenta carregar arquivo .env, mas não falha se não existir (em produção usa variáveis de ambiente da plataforma)
	if err := godotenv.Load(envFile); err != nil {
		if isProduction {
			log.Printf("Info: Arquivo %s não encontrado. Usando variáveis de ambiente da plataforma (Render/Vercel).", envFile)
		} else {
			log.Printf("Aviso: não foi possível carregar %s: %v", envFile, err)
		}
	}

	cfg := Config{
		DatabaseURL: os.Getenv("DATABASE_URL"),
		JWTSecret:   os.Getenv("JWT_SECRET"),
		Port:        os.Getenv("PORT"),
	}

	if cfg.DatabaseURL == "" {
		log.Fatal("DATABASE_URL não definido. Configure a variável de ambiente DATABASE_URL.")
	}

	if cfg.JWTSecret == "" {
		log.Fatal("JWT_SECRET não definido. Configure a variável de ambiente JWT_SECRET.")
	}

	// Porta padrão: 8090 para desenvolvimento, 9000 para produção (ou usa PORT da plataforma)
	if cfg.Port == "" {
		if isProduction {
			cfg.Port = "9000"
		} else {
			cfg.Port = "8090"
		}
	}

	return cfg
}
