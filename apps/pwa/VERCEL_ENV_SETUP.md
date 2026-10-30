# 🔧 Configuração de Variáveis de Ambiente no Vercel

## ⚠️ PROBLEMA IDENTIFICADO

O erro no build do Vercel acontece porque a `FIREBASE_PRIVATE_KEY` está configurada **incorretamente** no painel do Vercel.

```
Error: Failed to parse service account json file: Error: ENOENT: no such file or directory
```

Isso significa que o Vercel está interpretando a chave como um caminho de arquivo em vez de uma string.

---

## ✅ SOLUÇÃO: Como configurar no Vercel

### 1. Acesse o Vercel Dashboard

1. Vá em [https://vercel.com](https://vercel.com)
2. Selecione seu projeto `piscineiro-app`
3. Clique em **Settings** → **Environment Variables**

### 2. Configure as variáveis EXATAMENTE assim:

#### Frontend (públicas - com NEXT_PUBLIC_)

```
NEXT_PUBLIC_FIREBASE_API_KEY
AIzaSyDGKHR3euT4E3nbujQ3DWeFskYz-_uPDVo

NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
piscineiro-app.firebaseapp.com

NEXT_PUBLIC_FIREBASE_PROJECT_ID
piscineiro-app

NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
piscineiro-app.firebasestorage.app

NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
848192279894

NEXT_PUBLIC_FIREBASE_APP_ID
1:848192279894:web:bc544e22456fe278d9b2f7
```

#### Backend (secretas - SEM NEXT_PUBLIC_)

```
FIREBASE_PROJECT_ID
piscineiro-app

FIREBASE_CLIENT_EMAIL
firebase-adminsdk-fbsvc@piscineiro-app.iam.gserviceaccount.com
```

#### ⚠️ FIREBASE_PRIVATE_KEY (A MAIS IMPORTANTE!)

**NO VERCEL, configure SEM as aspas duplas externas:**

**Nome da variável:**
```
FIREBASE_PRIVATE_KEY
```

**Valor (cole EXATAMENTE assim, SEM aspas ao redor):**
```
-----BEGIN PRIVATE KEY-----
MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQCZwZHM9enj7RkP
EXX3wLDu9M/T1tjh7ylUW2/6oYbz25jVPdMjkfOKM5gUzaxlFXndh+woQ6WeVp9H
2hMAM6lw3B5g+LIRw8DB5gEfYwvEHSydLHWvdm/kk4gYMW87orARLPzTWkWo4WLV
D78VQ8TdWcBxdauu0o4mtikCcQsuY1NtPVozKn19AwC1O8seQq1M68Dx0Xnv0hjC
jJ4GWObzOUgtrAB6WUlycNMKVwqn0qZxlgkCEmb2BdHqryuv8I/LpYotTiyozZS0
sr1JPwtlTGj9napsag8EQA0xkVCQ4kAry6nt2lG+nh+VMrAk8UKmzmcIaSVkCXcb
frmtj0NRAgMBAAECggEAFb13cp4QyKAFK4rB/dp6igcGfcMCnouU8e8N2cfOD5vs
s7YOrRhdcZyS89oS9qX/ObIW06ig+c7wrZWpmx0y55jQGNEBSJ6/mgr9/KSiDMQ9
Qyn+p+UctBqiIx2WRz3dHEiapP2+HL9lnI+h6o1PACdJHSHQuSLfY5zdFpHKTXAY
weBaYZWo3FR5Dlf9aMxhvj2MOMYc7JeomCsqgfuqMSPpaYVugLqHlvVmHERHEFLl
7auQnKrvqoptnEH7XCa/+QXK94Ei+bBsneTFnkMsQafQwZkEzBpvJEGnYB8Ia6sm
XfkRXx4LnpmqHkpVSSNMQxT/thLA+BImYQgmyeVIWQKBgQDMbxE8fi4mbme+qJ9g
lkXcww/lgy6tO6RGFvdrssfdytmnazrcHMVFl/YxR3qQZet141YnfpcfypfRYXS7
MQCdfvar6mJBriiHdxmqoLl+1ZIEcjhlY7JodDEtKiTXQKLE/zuC/YwJFZmg2RWo
MwGhBXXgCt4Uhn5S5UTdId2x9QKBgQDAihVKHj27ttB7wIbRsarxUFiwJYNwLWa9
8QAwUcQctXHjN3jAoTv9EkxpOBxavymHCcf5fKSHX8BhPLNbXy1+olTVhfRC+VXT
F5LCinE6tYvw/9/rgeFfoG6xkU9B//a2VSXnwIOxY0tkZPCM6WWuhXMjIf9J+Vig
wqn5cQvGbQKBgQDJLiv6Kfpkm5XAzNQ7Cucpf1Rveo8+r0jUKNnHxKJno65Z0W6V
GkMQX6FJkZwN6h6zXst0BmHWSVrqFEv5wxll5IH/YKLdG/SKiyxY+95P8QDHG1hg
fqIdpOqYFbc3lUYZM0tvdvCOKBGNdtSXN8rMmUEM/+TYshoynakNLLys2QKBgQCy
cYdnqP1n8vfoKbgJslMO0XtQzYOyvLFDCpA1OCK8xMEnZ6rnRMd3NbVRsyo8RH01
ZTBMHmPR/0EqHXrRDTX57nMXbc3DIJiVSny/BlYIpmdrVYnvF/GLkgHlWhoNvi+m
LuYxkq+7AJ7IDfEPd+TASXg7MHAM3CZy39dukoHqRQKBgQCwF/t5Yddw71Q7OZqs
lGar6IhKcC1OffALXXE43OsAd0rOf7j4Rg6+cgwJc0MdDaMakubpjBxw+8NXcgrT
cpk0RNhHygwPnib6tRK+ch+lzoL6QIJ6UKqDdQQncO2xoAT/SBpZ/Nf+396yxpQB
DzkHoecnkcUTKz4IeFceWW+ZZw==
-----END PRIVATE KEY-----
```

**IMPORTANTE:**
- ✅ Inclua `-----BEGIN PRIVATE KEY-----` e `-----END PRIVATE KEY-----`
- ✅ Cole com as quebras de linha REAIS (não `\n`)
- ❌ **NÃO** coloque aspas `"` ao redor
- ❌ **NÃO** use `\n` literal - use quebras de linha reais

---

### 3. Aplique para todos os ambientes

Quando adicionar cada variável, selecione:
- ✅ Production
- ✅ Preview
- ✅ Development

---

### 4. Faça Redeploy

Após salvar TODAS as variáveis:

1. Vá em **Deployments**
2. Clique nos **três pontinhos** do último deploy
3. Clique em **Redeploy**

Ou faça um novo commit e push no Git.

---

## 🔍 Como verificar se está correto

Após o redeploy, procure nos logs:

✅ **Sucesso:**
```
[firebase] Todas as variáveis NEXT_PUBLIC_FIREBASE_* estão presentes.
[firebase-admin] FIREBASE_PROJECT_ID= OK
[firebase-admin] FIREBASE_CLIENT_EMAIL= OK  
[firebase-admin] FIREBASE_PRIVATE_KEY= OK
[firebase-admin] Inicialização concluída.
```

❌ **Erro (se ainda aparecer):**
```
Error: Failed to parse service account json file: Error: ENOENT
```

---

## 📝 Resumo da diferença

**`.env.local` (desenvolvimento local):**
```bash
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
```
↑ COM aspas e `\n`

**Vercel (produção):**
```
-----BEGIN PRIVATE KEY-----
MIIEvwI...
-----END PRIVATE KEY-----
```
↑ SEM aspas, com quebras de linha reais

---

## 🆘 Se ainda não funcionar

1. Delete a variável `FIREBASE_PRIVATE_KEY` completamente no Vercel
2. Crie novamente, colando o texto da chave com quebras de linha reais
3. Faça redeploy

---

**Depois de configurar, delete este arquivo (não deve ir para o Git):**
```bash
rm VERCEL_ENV_SETUP.md
```
