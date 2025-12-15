package main

import (
	"context"
	"log"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"portal-backend/config"
	"portal-backend/db"
	"portal-backend/handlers"
	"portal-backend/middleware"
)

func main() {
	cfg := config.Load()

	ctx := context.Background()
	pool := db.Connect(ctx, cfg.DatabaseURL)
	defer pool.Close()

	router := gin.Default()
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: false,
		MaxAge:           12 * time.Hour,
	}))

	authHandler := handlers.AuthHandler{DB: pool, JWTSecret: cfg.JWTSecret}
	productHandler := handlers.ProductHandler{DB: pool}

	// Responde na raiz para evitar 404 em verificações externas.
	router.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	api := router.Group("/api")
	{
		api.GET("/health", func(c *gin.Context) {
			c.JSON(200, gin.H{"status": "ok"})
		})
		api.POST("/auth/login", authHandler.Login)

		secured := api.Group("/")
		secured.Use(middleware.Auth(cfg.JWTSecret))
		{
			secured.GET("/products", productHandler.List)
			secured.GET("/products/:id", productHandler.Get)
			secured.POST("/products", productHandler.Create)
			secured.PUT("/products/:id", productHandler.Update)
			secured.DELETE("/products/:id", productHandler.Delete)
		}
	}

	log.Printf("API ouvindo na porta %s", cfg.Port)
	if err := router.Run(":" + cfg.Port); err != nil {
		log.Fatalf("erro ao subir servidor: %v", err)
	}
}

