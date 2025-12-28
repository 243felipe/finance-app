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

	var user models.User
	err := h.DB.QueryRow(
		c,
		`SELECT id::text, COALESCE(name, '') AS name, login, COALESCE(email, '') AS email, password_plain, created_at
         FROM users
         WHERE login=$1`,
		payload.Login,
	).Scan(&user.ID, &user.Name, &user.Login, &user.Email, &user.Password, &user.CreatedAt)
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
		if user.Password != payload.Password {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "Credenciais inválidas"})
			return
		}
	}

	token, err := h.generateToken(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao gerar token"})
		return
	}

	c.JSON(http.StatusOK, loginResponse{Token: token})
}

func (h *AuthHandler) generateToken(user models.User) (string, error) {
	claims := jwt.MapClaims{
		"userId": user.ID,
		"email":  user.Email,
		"exp":    time.Now().Add(24 * time.Hour).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(h.JWTSecret))
}
