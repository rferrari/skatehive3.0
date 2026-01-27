# Guia de Testes - Autenticação Userbase

**Branch:** `userbase`  
**Data:** 27 de Janeiro de 2026  
**Testadores:** Por favor, reportem os resultados na planilha de testes ou no Discord

---

## Visão Geral

Implementamos um novo sistema de "usuário lite" chamado **Userbase** que permite que usuários se cadastrem e usem o Skatehive sem precisar de uma conta na blockchain Hive. Este guia cobre todos os métodos de autenticação e suas combinações.

---

## Ambiente de Testes

- **URL:** `https://dev.skatehive.app`
- **Navegador:** Chrome recomendado (também testar Firefox, Safari)
- **Extensões necessárias:** 
  - Hive Keychain (para testes de login Hive)
  - MetaMask ou similar (para testes de login Ethereum)

---

## Cenários de Teste

### 📧 Teste 1: Login Apenas com Email (Novo Usuário)

**Passos:**
1. Abra o app em uma janela anônima/privada
2. Clique no botão de login na barra lateral (canto inferior esquerdo)
3. No Modal de Conexão, encontre a seção "App Account"
4. Clique no link "Sign up here"
5. Digite um email NOVO (que você nunca usou antes)
6. Digite um handle único (ex: `testador-seunome-1`)
7. Clique em "Sign Up"
8. Verifique seu email para o magic link
9. Clique no magic link para completar o cadastro
10. Você será redirecionado de volta e estará logado

**Resultados Esperados:**
- [ ] Email com magic link recebido em até 2 minutos
- [ ] Após clicar no link, usuário está logado
- [ ] Barra lateral mostra seu handle/nome de exibição
- [ ] Consegue navegar para `/user/[seu-handle]` e ver seu perfil
- [ ] Botão de editar perfil (ícone de lápis) aparece no seu perfil
- [ ] Consegue editar nome de exibição, handle, bio, localização, avatar, capa

**Relatório:**
```
Teste 1 - Login Email (Novo Usuário)
Resultado: PASSOU / FALHOU
Problemas: [descreva os problemas]
```

---

### 📧 Teste 2: Login com Email (Usuário Retornando)

**Passos:**
1. Abra o app (pode usar o mesmo navegador ou anônimo)
2. Clique no botão de login
3. Na seção "App Account", clique em "Sign in"
4. Digite o email usado no Teste 1
5. Verifique o email para o magic link
6. Clique no link

**Resultados Esperados:**
- [ ] Magic link recebido
- [ ] Logado na mesma conta de antes
- [ ] Dados do perfil (handle, avatar, etc.) persistiram

**Relatório:**
```
Teste 2 - Login Email (Retornando)
Resultado: PASSOU / FALHOU
Problemas: [descreva os problemas]
```

---

### 🐝 Teste 3: Login Apenas com Hive Keychain

**Passos:**
1. Abra o app em janela anônima (sessão nova)
2. Certifique-se de que a extensão Hive Keychain está instalada
3. Clique no botão de login
4. Clique em "Connect with Hive Keychain"
5. Aprove o login no popup do Keychain

**Resultados Esperados:**
- [ ] Popup do Keychain aparece
- [ ] Após aprovação, logado com nome de usuário Hive
- [ ] Consegue navegar para `/user/[usuario-hive]`
- [ ] Perfil mostra dados do Hive (seguidores, seguindo, posts, etc.)
- [ ] Aba de Snaps mostra seus snaps
- [ ] Consegue postar snaps/conteúdo

**Relatório:**
```
Teste 3 - Apenas Hive Keychain
Resultado: PASSOU / FALHOU
Problemas: [descreva os problemas]
```

---

### 💎 Teste 4: Login Apenas com Carteira Ethereum

**Passos:**
1. Abra o app em janela anônima
2. Certifique-se de que MetaMask (ou similar) está instalada
3. Clique no botão de login
4. Clique em "Connect with Ethereum"
5. Selecione a carteira e aprove a conexão
6. Assine a mensagem se solicitado

**Resultados Esperados:**
- [ ] Popup da carteira aparece
- [ ] Após aprovação, está logado
- [ ] Perfil mostra endereço da carteira ou nome ENS
- [ ] Consegue ver aba de tokens no perfil
- [ ] Toggle de perfil Zora disponível (se aplicável)

**Relatório:**
```
Teste 4 - Apenas Ethereum
Resultado: PASSOU / FALHOU
Problemas: [descreva os problemas]
```

---

### 🔗 Teste 5: Email + Vincular Identidade Hive

**Passos:**
1. Faça login com email primeiro (Teste 1 ou 2)
2. Vá para a página de Configurações (`/settings`)
3. Encontre a seção "Link Hive Account"
4. Clique em "Link Hive Account"
5. Aprove no Hive Keychain

**Resultados Esperados:**
- [ ] Conta Hive vinculada com sucesso
- [ ] Perfil agora mostra dados do Hive mesclados com dados userbase
- [ ] Consegue postar snaps que aparecem na blockchain Hive
- [ ] `/user/[usuario-hive]` mostra seu perfil

**Relatório:**
```
Teste 5 - Email + Vincular Hive
Resultado: PASSOU / FALHOU
Problemas: [descreva os problemas]
```

---

### 🔗 Teste 6: Email + Vincular Carteira Ethereum

**Passos:**
1. Faça login com email primeiro
2. Vá para a página de Configurações
3. Encontre a seção "Link Ethereum Wallet"
4. Clique para conectar carteira
5. Aprove a conexão e assine a mensagem

**Resultados Esperados:**
- [ ] Carteira vinculada com sucesso
- [ ] Consegue ver aba de tokens no perfil
- [ ] Endereço da carteira aparece nas configurações

**Relatório:**
```
Teste 6 - Email + Vincular Ethereum
Resultado: PASSOU / FALHOU
Problemas: [descreva os problemas]
```

---

### 🔗 Teste 7: Hive Primeiro, Depois Email

**Passos:**
1. Faça login com Hive Keychain primeiro (sessão nova)
2. Verifique se conta userbase foi criada automaticamente
3. Vá para Configurações
4. Tente vincular/adicionar email à conta

**Resultados Esperados:**
- [ ] Documente o que acontece
- [ ] Vincular email está disponível?
- [ ] Funciona?

**Relatório:**
```
Teste 7 - Hive Primeiro + Email
Resultado: PASSOU / FALHOU / NÃO IMPLEMENTADO
Problemas: [descreva os problemas]
```

---

### 📝 Teste 8: Postar um Snap (Usuário Apenas Email)

**Passos:**
1. Faça login apenas com email (sem Hive vinculado)
2. Clique no botão de compor/postar
3. Crie um snap com texto e/ou imagem
4. Envie

**Resultados Esperados:**
- [ ] Snap postado com sucesso
- [ ] Snap aparece na aba de Snaps do seu perfil
- [ ] Snap aparece no feed principal
- [ ] Snap mostra seu nome de exibição (não "skateuser")

**Relatório:**
```
Teste 8 - Postar Snap (Usuário Email)
Resultado: PASSOU / FALHOU
Problemas: [descreva os problemas]
```

---

### ❤️ Teste 9: Votar em Conteúdo (Usuário Apenas Email)

**Passos:**
1. Faça login apenas com email
2. Encontre qualquer post no feed
3. Clique no botão de votar/curtir
4. Verifique se o voto foi registrado

**Resultados Esperados:**
- [ ] Voto enviado com sucesso
- [ ] Contagem de votos atualiza
- [ ] Seu voto é lembrado ao atualizar a página

**Relatório:**
```
Teste 9 - Votar (Usuário Email)
Resultado: PASSOU / FALHOU
Problemas: [descreva os problemas]
```

---

### ✏️ Teste 10: Editar Perfil

**Passos:**
1. Faça login (qualquer método)
2. Vá para sua página de perfil
3. Clique no botão de editar (ícone de lápis perto do nome)
4. Mude o nome de exibição
5. Faça upload de novo avatar
6. Faça upload de imagem de capa
7. Adicione bio e localização
8. Salve

**Resultados Esperados:**
- [ ] Modal de edição abre com estilo SkateModal
- [ ] Consegue fazer upload de avatar (IPFS)
- [ ] Consegue fazer upload de capa (IPFS)
- [ ] Alterações salvam com sucesso
- [ ] Perfil atualiza imediatamente após salvar

**Relatório:**
```
Teste 10 - Editar Perfil
Resultado: PASSOU / FALHOU
Problemas: [descreva os problemas]
```

---

### 🚪 Teste 11: Logout

**Passos:**
1. Enquanto logado, clique no botão de usuário na barra lateral
2. Clique em "Sign Out" ou "Desconectar"
3. Confirme o logout

**Resultados Esperados:**
- [ ] Logout feito com sucesso
- [ ] Sessão limpa
- [ ] Redirecionado apropriadamente
- [ ] Consegue logar novamente

**Relatório:**
```
Teste 11 - Logout
Resultado: PASSOU / FALHOU
Problemas: [descreva os problemas]
```

---

### 📱 Teste 12: Experiência Mobile

**Passos:**
1. Abra o app no celular ou use ferramentas de desenvolvedor em modo mobile
2. Teste o fluxo de login
3. Teste a navegação
4. Teste postar
5. Teste visualizar/editar perfil

**Resultados Esperados:**
- [ ] Login funciona no mobile
- [ ] UI é responsiva
- [ ] Consegue navegar e usar funcionalidades

**Relatório:**
```
Teste 12 - Mobile
Resultado: PASSOU / FALHOU
Problemas: [descreva os problemas]
```

---

## Problemas Conhecidos (Não Reporte Estes)

- Warnings de inicialização do WalletConnect no console (cosmético)
- Erro 404 `/loadingsfx.mp3` (asset faltando)
- Alguns erros de RPC Hive "Invalid parameters" para usernames inexistentes

---

## Template de Relatório de Bug

```markdown
## Relatório de Bug

**Número do Teste:** #
**Testador:** [seu nome]
**Data:** 
**Navegador/Dispositivo:** 

### Passos para Reproduzir
1. 
2. 
3. 

### Comportamento Esperado


### Comportamento Real


### Screenshots/Erros do Console
[anexar se aplicável]

### Severidade
- [ ] Bloqueador (não consegue continuar)
- [ ] Maior (funcionalidade quebrada)
- [ ] Menor (cosmético/inconveniente)
```

---

## Resumo do Checklist de Testes

| Teste | Descrição | Testador | Resultado |
|-------|-----------|----------|-----------|
| 1 | Cadastro email (novo usuário) | | |
| 2 | Login email (retornando) | | |
| 3 | Apenas Hive Keychain | | |
| 4 | Apenas Ethereum | | |
| 5 | Email + vincular Hive | | |
| 6 | Email + vincular Ethereum | | |
| 7 | Hive primeiro + email | | |
| 8 | Postar snap (usuário email) | | |
| 9 | Votar (usuário email) | | |
| 10 | Editar perfil | | |
| 11 | Logout | | |
| 12 | Mobile | | |

---

## Perguntas a Responder

1. O fluxo de login é intuitivo?
2. As mensagens de erro são claras quando algo falha?
3. A página de perfil mostra suas informações corretamente?
4. Você consegue encontrar o botão de editar perfil facilmente?
5. Alguma confusão entre handle e nome de exibição?

---

## Contato

Reporte problemas em: [canal do Discord / GitHub issues / etc.]

Valeu por testar! 🛹
