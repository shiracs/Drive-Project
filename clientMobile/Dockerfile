FROM node:18-alpine

WORKDIR /app

# העתקת הגדרות החבילות והתקנה
COPY package*.json ./
RUN npm install

# העתקת שאר הקבצים
COPY . .

# הגדרת משתני סביבה כדי ש-Expo יעבוד מתוך דוקר
ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
ENV CI=1

# חשיפת הפורט של Expo
EXPOSE 8081

# הרצה במצב LAN כדי שטלפונים יוכלו להתחבר
CMD ["npx", "expo", "start", "--lan"]