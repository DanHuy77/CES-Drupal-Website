### CES Drupal Website

CES website build by Drupal CMS

### Prerequisites

- Docker & Docker Compose
- PHP

### Getting Started

1. Clone the repository:

   ```bash
   git clone git@github.com:Code-Engine-Studio/ces-drupal-website.git
   ```

2. Navigate to the project directory:

   ```bash
   cd <project_directory>
   ```

3. Create a `.env` file:

   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with appropriate values for your environment.

5. Create an external network:

  ```
   docker network create traefik
  ```

6. To generate SSL/TLS certificates (traefik.crt and traefik.key) for Traefik:

  ```
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout traefik.key -out traefik.crt
  ```
After running these commands, you'll have traefik.crt (certificate) and traefik.key (private key) files generated in the current directory. 

### Usage

#### Starting the Services

**Note: If this is your first run, please leave the parameter DRUPAL_SKIP_BOOTSTRAP=false

To start the services defined in the `docker-compose.yml` file, run:

```bash
docker-compose up -d
```

#### Accessing Drupal Website

Once the services are up and running, you can access the Drupal website at:

- https://ces-website.lndo.site

#### Stopping the Services

To stop the services, run:

```bash
docker-compose down
```

### Troubleshoot

- If you remove the container all your data will be lost, and the next time you run the image the database will be reinitialized. To avoid this loss of data, you should mount a volume that will persist even after the container is removed. Find out more [here](https://github.com/bitnami/containers/tree/main/bitnami/drupal#persisting-your-application).

- If when running your port is being used by another process, please stop that process before running docker-compose. 

For example apache running on port 80 stop it with command:
```
sudo systemctl stop apache2.service
```


### Import database

1. Copy the database into the container:

   ```
   docker cp ./dump.sql ces:/tmp/dump.sql
   ```

2. Access inside the container:

   ```
   docker exec -it ces bash
   ```

3. Import database:

   ```
   drush sql:cli < /tmp/dump.sql
   ```"# CES-Drupal-Website" 
