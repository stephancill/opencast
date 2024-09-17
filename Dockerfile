# Use the official Node.js image.
FROM node:20

# Install necessary build tools
RUN apk add python3 make g++ gcc

# Set the working directory inside the container.
WORKDIR /app

# Copy the package.json and yarn.lock files.
COPY package.json yarn.lock* ./

# Install dependencies.
RUN yarn install --frozen-lockfile

# Copy the rest of the application code.
COPY . .

# Generate Prisma client
RUN yarn prisma generate

# Build the Next.js application.
RUN yarn build --no-lint

# Expose the port the app runs on.
EXPOSE 3000

# Define the command to run the app.
CMD ["yarn", "start"]
