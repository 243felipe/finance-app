package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
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
	// Tenta JSON; se falhar, tenta form, reutilizando o corpo.
	if err := c.ShouldBindBodyWith(&payload, binding.JSON); err != nil {
		_ = c.ShouldBindBodyWith(&payload, binding.Form)
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

	var user models.User
	err := h.DB.QueryRow(
		c,
		`SELECT id::text, COALESCE(name, '') AS name, login, COALESCE(email, '') AS email, password_plain, created_at
         FROM users
         WHERE login=$1`,
		payload.Login,
	).Scan(&user.ID, &user.Name, &user.Login, &user.Email, &user.Password, &user.CreatedAt)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Credenciais inválidas"})
		return
	}

	if user.Password != payload.Password {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Credenciais inválidas"})
		return
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
