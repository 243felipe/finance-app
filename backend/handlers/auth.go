package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"portal-backend/models"
)

type AuthHandler struct {
	DB        *pgxpool.Pool
	JWTSecret string
}

type loginRequest struct {
	Login    string `json:"login" form:"login"`
	Password string `json:"password" form:"password"`
}

type loginResponse struct {
	Token string `json:"token"`
	Name  string `json:"name"`
}

func (h *AuthHandler) Login(c *gin.Context) {
	var payload loginRequest
	// Tenta JSON; se falhar, tenta form/urlencoded padrão.
	if err := c.ShouldBindJSON(&payload); err != nil {
		_ = c.ShouldBind(&payload)
	}
	// Fallback extra: tenta buscar direto do form/query se ainda vazio
	if payload.Login == "" {
		payload.Login = c.PostForm("login")
		if payload.Login == "" {
			payload.Login = c.Query("login")
		}
	}
	if payload.Password == "" {
		payload.Password = c.PostForm("password")
		if payload.Password == "" {
			payload.Password = c.Query("password")
		}
	}
	// Se ainda estiver vazio, tenta ler o raw body e parsear JSON manualmente
	if payload.Login == "" || payload.Password == "" {
		if raw, err := c.GetRawData(); err == nil {
			log.Printf("login raw body: %s", string(raw))
			var m map[string]interface{}
			if err := json.Unmarshal(raw, &m); err == nil {
				if payload.Login == "" {
					if v, ok := m["login"].(string); ok {
						payload.Login = v
					}
				}
				if payload.Password == "" {
					if v, ok := m["password"].(string); ok {
						payload.Password = v
					}
				}
			}
		}
	}

	// Permite credencial de teste local sem afetar prod (habilite com ALLOW_TEST_LOGIN=true)
	allowTest := strings.EqualFold(os.Getenv("ALLOW_TEST_LOGIN"), "true") || os.Getenv("ALLOW_TEST_LOGIN") == "1"
	testLogin := os.Getenv("AUTH_TEST_LOGIN")
	if testLogin == "" {
		testLogin = "admin"
	}
	testPass := os.Getenv("AUTH_TEST_PASSWORD")
	if testPass == "" {
		testPass = "admin123"
	}

	// Primeiro verifica a senha
	var user models.User
	var passwordFromDB string
	err := h.DB.QueryRow(
		c,
		`SELECT id::text, login, COALESCE(email, '') AS email, password_plain, created_at
         FROM users
         WHERE login=$1`,
		payload.Login,
	).Scan(&user.ID, &user.Login, &user.Email, &passwordFromDB, &user.CreatedAt)
	if err != nil {
		if allowTest && payload.Login == testLogin && payload.Password == testPass {
			user = models.User{
				ID:        "test",
				Name:      "Usuário teste",
				Login:     testLogin,
				Email:     "",
				Password:  testPass,
				CreatedAt: time.Now(),
			}
		} else {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "Credenciais inválidas"})
			return
		}
	} else {
		if passwordFromDB != payload.Password {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "Credenciais inválidas"})
			return
		}
	}

	// Usa a query fornecida para buscar o nome: select u.name from users u where u.login = :login
	var name string
	err = h.DB.QueryRow(
		c,
		`SELECT u.name FROM users u WHERE u.login = $1`,
		payload.Login,
	).Scan(&name)

	if err != nil {
		// Se não encontrar, usa um valor padrão
		name = ""
	}

	// Atualiza o nome do usuário com o resultado da query
	user.Name = name

	token, err := h.generateToken(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao gerar token"})
		return
	}

	// Gera lançamentos recorrentes automaticamente após login bem-sucedido
	// Executa em background para não atrasar a resposta
	go func() {
		recorrenteHandler := LancamentoRecorrenteHandler{DB: h.DB}
		if err := recorrenteHandler.GerarLancamentosAutomaticos(c.Request.Context()); err != nil {
			log.Printf("Erro ao gerar lançamentos recorrentes: %v", err)
		}
	}()

	c.JSON(http.StatusOK, loginResponse{Token: token, Name: user.Name})
}

func (h *AuthHandler) generateToken(user models.User) (string, error) {
	claims := jwt.MapClaims{
		"userId": user.ID,
		"login":  user.Login,
		"email":  user.Email,
		"exp":    time.Now().Add(24 * time.Hour).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(h.JWTSecret))
}

type profileResponse struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Login string `json:"login"`
	Email string `json:"email"`
}

type updateProfileRequest struct {
	Name     *string `json:"name,omitempty"`
	Login    *string `json:"login,omitempty"`
	Password *string `json:"password,omitempty"`
}

// GetProfile retorna os dados do perfil do usuário autenticado
func (h *AuthHandler) GetProfile(c *gin.Context) {
	userID, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Usuário não autenticado"})
		return
	}

	// Busca o login do usuário pelo userId
	var currentLogin string
	err := h.DB.QueryRow(
		c,
		`SELECT login FROM users WHERE id=$1`,
		userID,
	).Scan(&currentLogin)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Usuário não encontrado"})
		return
	}

	// Usa a query fornecida: select u.name from users u where u.login = :login
	// Mas também busca os outros dados necessários
	var user models.User
	err = h.DB.QueryRow(
		c,
		`SELECT id::text, COALESCE(u.name, '') AS name, u.login, COALESCE(u.email, '') AS email
         FROM users u
         WHERE u.login = $1`,
		currentLogin,
	).Scan(&user.ID, &user.Name, &user.Login, &user.Email)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Usuário não encontrado"})
		return
	}

	c.JSON(http.StatusOK, profileResponse{
		ID:    user.ID,
		Name:  user.Name,
		Login: user.Login,
		Email: user.Email,
	})
}

// UpdateProfile atualiza os dados do perfil do usuário autenticado
func (h *AuthHandler) UpdateProfile(c *gin.Context) {
	userID, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Usuário não autenticado"})
		return
	}

	userIDStr, ok := userID.(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao obter ID do usuário"})
		return
	}

	// Busca o login atual do usuário
	var currentLogin string
	err := h.DB.QueryRow(
		c,
		`SELECT login FROM users WHERE id=$1`,
		userIDStr,
	).Scan(&currentLogin)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Usuário não encontrado"})
		return
	}

	var payload updateProfileRequest
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Dados inválidos"})
		return
	}

	// Verifica se o login já existe (se estiver sendo atualizado)
	if payload.Login != nil && *payload.Login != "" && *payload.Login != currentLogin {
		var existingID string
		err := h.DB.QueryRow(
			c,
			`SELECT id::text FROM users WHERE login=$1`,
			*payload.Login,
		).Scan(&existingID)

		if err == nil {
			c.JSON(http.StatusConflict, gin.H{"message": "Login já está em uso"})
			return
		}
	}

	// Atualiza o nome se fornecido: update users set name = :name where login = :login
	if payload.Name != nil && *payload.Name != "" {
		_, err = h.DB.Exec(
			c,
			`UPDATE users SET name = $1 WHERE login = $2`,
			*payload.Name,
			currentLogin,
		)
		if err != nil {
			log.Printf("Erro ao atualizar nome: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao atualizar nome"})
			return
		}
	}

	// Atualiza a senha se fornecida: update users set password_plain = :password where login = :login
	if payload.Password != nil && *payload.Password != "" {
		_, err = h.DB.Exec(
			c,
			`UPDATE users SET password_plain = $1 WHERE login = $2`,
			*payload.Password,
			currentLogin,
		)
		if err != nil {
			log.Printf("Erro ao atualizar senha: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao atualizar senha"})
			return
		}
	}

	// Atualiza o login se fornecido (depois de atualizar nome e senha)
	if payload.Login != nil && *payload.Login != "" && *payload.Login != currentLogin {
		_, err = h.DB.Exec(
			c,
			`UPDATE users SET login = $1 WHERE login = $2`,
			*payload.Login,
			currentLogin,
		)
		if err != nil {
			log.Printf("Erro ao atualizar login: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao atualizar login"})
			return
		}
		currentLogin = *payload.Login
	}

	// Busca os dados atualizados do usuário
	var user models.User
	err = h.DB.QueryRow(
		c,
		`SELECT id::text, COALESCE(name, '') AS name, login, COALESCE(email, '') AS email
         FROM users
         WHERE login=$1`,
		currentLogin,
	).Scan(&user.ID, &user.Name, &user.Login, &user.Email)

	if err != nil {
		log.Printf("Erro ao buscar dados atualizados: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao buscar dados atualizados"})
		return
	}

	c.JSON(http.StatusOK, profileResponse{
		ID:    user.ID,
		Name:  user.Name,
		Login: user.Login,
		Email: user.Email,
	})
}
