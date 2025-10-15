FROM node:20-alpine

WORKDIR /app

# Alleen package files eerst (caching)
COPY package*.json ./
RUN npm ci || npm install

# Dan de rest
COPY . .

# Zet dit gelijk aan je backend-poort (jij gebruikte 5050)
ENV PORT=5050
EXPOSE 5050

# In dev: hot reload (bv. nodemon) – anders "npm start"
CMD ["npm", "run", "dev"]
