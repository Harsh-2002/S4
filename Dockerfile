# ---- Build Stage ----
# Use an official Node.js runtime as the base image
FROM node:24-alpine AS build

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package.json package-lock.json* ./

# Install project dependencies
RUN npm install

# Copy the rest of the application source code to the working directory
COPY . .

# Build the React application for production
RUN npm run build

# ---- Production Stage ----
# Use the official Caddy image for a lean production server
FROM caddy:2-alpine

# Copy the built static files from the build stage to Caddy's webroot
COPY --from=build /app/dist /usr/share/caddy

# Copy the Caddyfile configuration
COPY Caddyfile /etc/caddy/Caddyfile

# Format the Caddyfile
RUN caddy fmt --overwrite /etc/caddy/Caddyfile

# Expose the port Caddy will listen on
EXPOSE 8080
