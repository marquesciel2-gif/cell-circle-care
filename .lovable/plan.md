

# Atualizar o Favicon do Aplicativo

## O que sera feito
Trocar o icone atual do aplicativo (favicon) pela imagem do celular com carrinho de compras que voce enviou.

## Passos

1. **Copiar a imagem** para a pasta `public/` do projeto como `favicon.png`
2. **Atualizar o `index.html`** para referenciar o novo favicon em vez do antigo `favicon.ico`

## Detalhes tecnicos

- O arquivo `index.html` sera atualizado para usar a tag `<link rel="icon" href="/favicon.png" type="image/png">`
- O favicon antigo (`favicon.ico`) sera substituido pela nova imagem

