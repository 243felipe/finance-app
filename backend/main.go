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
	financialCategoryHandler := handlers.FinancialCategoryHandler{DB: pool}
	fixedAccountHandler := handlers.FixedAccountHandler{DB: pool}
	fonteRendaHandler := handlers.FonteRendaHandler{DB: pool}
	formaPagamentoHandler := handlers.FormaPagamentoHandler{DB: pool}
	lancamentoHandler := handlers.LancamentoHandler{DB: pool}
	lancamentoRecorrenteHandler := handlers.LancamentoRecorrenteHandler{DB: pool}
	listaComprasHandler := handlers.ListaComprasHandler{DB: pool}
	itemListaComprasHandler := handlers.ItemListaComprasHandler{DB: pool}
	dashboardHandler := handlers.DashboardHandler{DB: pool}

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
			secured.GET("/auth/profile", authHandler.GetProfile)
			secured.PUT("/auth/profile", authHandler.UpdateProfile)

			secured.GET("/products", productHandler.List)
			secured.GET("/products/:id", productHandler.Get)
			secured.POST("/products", productHandler.Create)
			secured.PUT("/products/:id", productHandler.Update)
			secured.DELETE("/products/:id", productHandler.Delete)

			secured.GET("/categorias-financeiras", financialCategoryHandler.List)
			secured.GET("/categorias-financeiras/:id", financialCategoryHandler.Get)
			secured.POST("/categorias-financeiras", financialCategoryHandler.Create)
			secured.PUT("/categorias-financeiras/:id", financialCategoryHandler.Update)
			secured.DELETE("/categorias-financeiras/:id", financialCategoryHandler.Delete)

			secured.GET("/contas-fixas", fixedAccountHandler.List)
			secured.GET("/contas-fixas/:id", fixedAccountHandler.Get)
			secured.GET("/contas-fixas/total", fixedAccountHandler.Total)
			secured.POST("/contas-fixas", fixedAccountHandler.Create)
			secured.PUT("/contas-fixas/:id", fixedAccountHandler.Update)
			secured.DELETE("/contas-fixas/:id", fixedAccountHandler.Delete)

			secured.GET("/fontes-renda", fonteRendaHandler.List)
			secured.GET("/fontes-renda/:id", fonteRendaHandler.Get)
			secured.POST("/fontes-renda", fonteRendaHandler.Create)
			secured.PUT("/fontes-renda/:id", fonteRendaHandler.Update)
			secured.DELETE("/fontes-renda/:id", fonteRendaHandler.Delete)

			secured.GET("/formas-pagamento", formaPagamentoHandler.List)
			secured.GET("/formas-pagamento/:id", formaPagamentoHandler.Get)
			secured.POST("/formas-pagamento", formaPagamentoHandler.Create)
			secured.PUT("/formas-pagamento/:id", formaPagamentoHandler.Update)
			secured.DELETE("/formas-pagamento/:id", formaPagamentoHandler.Delete)

			secured.GET("/lancamentos", lancamentoHandler.List)
			secured.GET("/lancamentos/filtro", lancamentoHandler.ListByDateRange)
			secured.GET("/lancamentos/:id", lancamentoHandler.Get)
			secured.POST("/lancamentos", lancamentoHandler.Create)
			secured.PUT("/lancamentos/:id", lancamentoHandler.Update)
			secured.DELETE("/lancamentos/:id", lancamentoHandler.Delete)

			secured.GET("/lancamentos-recorrentes/entradas", lancamentoRecorrenteHandler.ListEntradas)
			secured.GET("/lancamentos-recorrentes/saidas", lancamentoRecorrenteHandler.ListSaidas)
			secured.POST("/lancamentos-recorrentes", lancamentoRecorrenteHandler.Create)
			secured.PUT("/lancamentos-recorrentes/:id", lancamentoRecorrenteHandler.Update)
			secured.DELETE("/lancamentos-recorrentes/:id", lancamentoRecorrenteHandler.Delete)

			secured.GET("/lista-compras", listaComprasHandler.List)
			secured.GET("/lista-compras/:id", listaComprasHandler.Get)
			secured.POST("/lista-compras", listaComprasHandler.Create)
			secured.PUT("/lista-compras/:id", listaComprasHandler.Update)
			secured.DELETE("/lista-compras/:id", listaComprasHandler.Delete)

			secured.GET("/item-lista-compras", itemListaComprasHandler.List)
			secured.GET("/item-lista-compras/:id", itemListaComprasHandler.Get)
			secured.POST("/item-lista-compras", itemListaComprasHandler.Create)
			secured.PUT("/item-lista-compras/:id", itemListaComprasHandler.Update)
			secured.DELETE("/item-lista-compras/:id", itemListaComprasHandler.Delete)

			// Dashboard endpoints
			secured.GET("/dashboard/cards", dashboardHandler.GetCards)
			secured.GET("/dashboard/charts", dashboardHandler.GetCharts)
			secured.GET("/dashboard/lancamentos-saidas-mes", dashboardHandler.GetLancamentosSaidasMes)
		}
	}

	log.Printf("API ouvindo na porta %s", cfg.Port)
	if err := router.Run(":" + cfg.Port); err != nil {
		log.Fatalf("erro ao subir servidor: %v", err)
	}
}
