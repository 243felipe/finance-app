package models

import "time"

type User struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Login     string    `json:"login"`
	Email     string    `json:"email"` // mantido por compatibilidade, pode ficar vazio
	Password  string    `json:"-"`     // senha em texto simples (apenas para este cenário)
	CreatedAt time.Time `json:"createdAt"`
}
