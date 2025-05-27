# Use an official Node.js runtime as a parent image
FROM node:20-alpine as build

# Set the working directory in the container
WORKDIR /app

# Copy package.json and pnpm-lock.yaml to install dependencies
COPY package.json pnpm-lock.yaml ./

# Install pnpm and then frontend dependencies
# If you are using npm, change these lines accordingly:
# RUN npm install
RUN npm install -g pnpm && pnpm install

# Copy the rest of the application code
COPY . .

# Build the React application for production
# Assuming `pnpm build` creates the production build in a 'dist' folder
RUN pnpm build

# Stage 2: Serve the built application with a lightweight web server (e.g., Nginx)
FROM nginx:alpine

# Copy the built React app from the 'build' stage to Nginx's public directory
COPY --from=build /app/dist /usr/share/nginx/html

# Copy a custom Nginx configuration (optional, but good practice for SPAs)
# Create `frontend/nginx.conf` if you want to use this.
# COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# Expose the port Nginx will serve on
EXPOSE 80

# Command to start Nginx
CMD ["nginx", "-g", "daemon off;"]