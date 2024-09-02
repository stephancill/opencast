# Use the official Node.js image.
FROM node:18-alpine

# Set the working directory inside the container.
WORKDIR /app

# Copy the package.json and yarn.lock files.
COPY package*.json ./

# Install dependencies.
RUN yarn install

# Copy the rest of the application code.
COPY . .

# Build the Next.js application.
RUN yarn build

# Expose the port the app runs on.
EXPOSE 3000

# Define the command to run the app.
CMD ["yarn", "start"]
