pipeline {
  agent {
    docker {
      image 'docker:26-dind'
      args '-u root -v /var/run/docker.sock:/var/run/docker.sock'
    }
  }

  options {
    ansiColor('xterm')
    disableConcurrentBuilds()
    skipDefaultCheckout(true)
    timestamps()
  }

  environment {
    BACKEND_IMAGE_PREFIX = 'pdf-toolkit/backend'
    FRONTEND_IMAGE_PREFIX = 'pdf-toolkit/frontend'
    CMS_BACKEND_IMAGE_PREFIX = 'pdf-toolkit/cms-backend'
    CMS_FRONTEND_IMAGE_PREFIX = 'pdf-toolkit/cms-frontend'
    BACKEND_CONTAINER = 'pdf-toolkit-backend'
    FRONTEND_CONTAINER = 'pdf-toolkit-frontend'
    CMS_BACKEND_CONTAINER = 'cms-backend-api'
    CMS_FRONTEND_CONTAINER = 'cms-frontend'
    COMPOSE_FILE = 'docker-compose.prod.yml'
    DEPLOY_ENV_FILE = '.env.deploy'
    DOCKER_CONFIG = "${WORKSPACE}/.docker"
    DOCKER_BUILDKIT = '1'
    COMPOSE_DOCKER_CLI_BUILD = '1'
  }

  stages {
    stage('Clone Repository') {
      steps {
        checkout scm
      }
    }

    stage('Resolve Git Commit') {
      steps {
        sh '''
          apk add --no-cache git bash >/dev/null
          git config --global --add safe.directory "$WORKSPACE"
        '''
        script {
          env.GIT_COMMIT_FULL = sh(
            script: 'git rev-parse HEAD',
            returnStdout: true
          ).trim()
          env.GIT_COMMIT_SHORT = sh(
            script: 'git rev-parse --short=7 HEAD',
            returnStdout: true
          ).trim()
          env.BACKEND_IMAGE = "${env.BACKEND_IMAGE_PREFIX}:${env.GIT_COMMIT_SHORT}"
          env.FRONTEND_IMAGE = "${env.FRONTEND_IMAGE_PREFIX}:${env.GIT_COMMIT_SHORT}"
          env.CMS_BACKEND_IMAGE = "${env.CMS_BACKEND_IMAGE_PREFIX}:${env.GIT_COMMIT_SHORT}"
          env.CMS_FRONTEND_IMAGE = "${env.CMS_FRONTEND_IMAGE_PREFIX}:${env.GIT_COMMIT_SHORT}"
        }
      }
    }

    stage('Prepare Docker') {
      steps {
        sh '''
          mkdir -p "$DOCKER_CONFIG"
          docker version
          docker compose version
        '''
      }
    }

    stage('Load Environment File') {
      steps {
        withCredentials([
          file(credentialsId: 'pdf-toolkit-prod-env', variable: 'ENV_FILE')
        ]) {
          sh '''
            echo "Loading deployment environment file from Jenkins credentials"
            cp "$ENV_FILE" "$DEPLOY_ENV_FILE"
            chmod 600 "$DEPLOY_ENV_FILE"
          '''
        }
      }
    }

    stage('Resolve Current Release') {
      steps {
        script {
          env.PREVIOUS_BACKEND_IMAGE = sh(
            script: "docker container inspect -f '{{.Config.Image}}' '${env.BACKEND_CONTAINER}' 2>/dev/null || true",
            returnStdout: true
          ).trim()
          env.PREVIOUS_FRONTEND_IMAGE = sh(
            script: "docker container inspect -f '{{.Config.Image}}' '${env.FRONTEND_CONTAINER}' 2>/dev/null || true",
            returnStdout: true
          ).trim()
          env.PREVIOUS_CMS_BACKEND_IMAGE = sh(
            script: "docker container inspect -f '{{.Config.Image}}' '${env.CMS_BACKEND_CONTAINER}' 2>/dev/null || true",
            returnStdout: true
          ).trim()
          env.PREVIOUS_CMS_FRONTEND_IMAGE = sh(
            script: "docker container inspect -f '{{.Config.Image}}' '${env.CMS_FRONTEND_CONTAINER}' 2>/dev/null || true",
            returnStdout: true
          ).trim()
        }
      }
    }

    stage('Build Backend Image') {
      steps {
        sh '''
          echo "Building backend image ${BACKEND_IMAGE}"
          docker build -f backend/Dockerfile -t "${BACKEND_IMAGE}" backend
        '''
      }
    }

    stage('Build Frontend Image') {
      steps {
        sh '''
          echo "Building frontend image ${FRONTEND_IMAGE}"
          set -a
          . "$DEPLOY_ENV_FILE"
          set +a

          docker build \
            -f frontend/Dockerfile \
            --build-arg APP_DEV="false" \
            --build-arg NEXT_PUBLIC_APP_DEV="false" \
            --build-arg DEV_INTERNAL_API_ORIGIN="${DEV_INTERNAL_API_ORIGIN:-http://pdf-toolkit-backend:8000}" \
            --build-arg PROD_INTERNAL_API_ORIGIN="${PROD_INTERNAL_API_ORIGIN:-http://pdf-toolkit-backend:8000}" \
            --build-arg NEXT_PUBLIC_DEV_SITE_ORIGIN="${NEXT_PUBLIC_DEV_SITE_ORIGIN:-http://localhost:3000}" \
            --build-arg NEXT_PUBLIC_PROD_SITE_ORIGIN="${NEXT_PUBLIC_PROD_SITE_ORIGIN:-https://pdf.example.com}" \
            -t "${FRONTEND_IMAGE}" \
            frontend
        '''
      }
    }

    stage('Build CMS Backend Image') {
      steps {
        sh '''
          echo "Building CMS backend image ${CMS_BACKEND_IMAGE}"
          docker build -f cms-backend/Dockerfile -t "${CMS_BACKEND_IMAGE}" cms-backend
        '''
      }
    }

    stage('Build CMS Frontend Image') {
      steps {
        sh '''
          echo "Building CMS frontend image ${CMS_FRONTEND_IMAGE}"
          docker build \
            -f cms-frontend/Dockerfile \
            --build-arg APP_DEV="false" \
            --build-arg NEXT_PUBLIC_APP_DEV="false" \
            -t "${CMS_FRONTEND_IMAGE}" \
            cms-frontend
        '''
      }
    }

    stage('Run CMS Migrations') {
      steps {
        sh '''
          set -eu
          ./scripts/migrate-cms-prod.sh "$DEPLOY_ENV_FILE"
        '''
      }
    }

    stage('Deploy with Docker Compose') {
      steps {
        script {
          def deployStatus = sh(
            script: """
              set -eu
              echo "Deploying commit ${env.GIT_COMMIT_SHORT}"
              export BACKEND_IMAGE='${env.BACKEND_IMAGE}'
              export FRONTEND_IMAGE='${env.FRONTEND_IMAGE}'
              export CMS_BACKEND_IMAGE='${env.CMS_BACKEND_IMAGE}'
              export CMS_FRONTEND_IMAGE='${env.CMS_FRONTEND_IMAGE}'
              docker compose --env-file '${env.DEPLOY_ENV_FILE}' -f '${env.COMPOSE_FILE}' up -d --wait --wait-timeout 240 --remove-orphans
              docker compose --env-file '${env.DEPLOY_ENV_FILE}' -f '${env.COMPOSE_FILE}' ps
            """,
            returnStatus: true
          )

          if (deployStatus != 0) {
            if (
              env.PREVIOUS_BACKEND_IMAGE?.trim() &&
              env.PREVIOUS_FRONTEND_IMAGE?.trim() &&
              env.PREVIOUS_CMS_BACKEND_IMAGE?.trim() &&
              env.PREVIOUS_CMS_FRONTEND_IMAGE?.trim()
            ) {
              sh """
                set -eu
                echo "Deployment failed health checks. Rolling back to previous images."
                export BACKEND_IMAGE='${env.PREVIOUS_BACKEND_IMAGE}'
                export FRONTEND_IMAGE='${env.PREVIOUS_FRONTEND_IMAGE}'
                export CMS_BACKEND_IMAGE='${env.PREVIOUS_CMS_BACKEND_IMAGE}'
                export CMS_FRONTEND_IMAGE='${env.PREVIOUS_CMS_FRONTEND_IMAGE}'
                docker compose --env-file '${env.DEPLOY_ENV_FILE}' -f '${env.COMPOSE_FILE}' up -d --wait --wait-timeout 240 --remove-orphans
                docker compose --env-file '${env.DEPLOY_ENV_FILE}' -f '${env.COMPOSE_FILE}' ps
              """
            }

            error("Deployment failed (${env.GIT_COMMIT_SHORT})")
          }
        }
      }
    }

    stage('Tag Release Pointers') {
      steps {
        sh """
          set -eu

          docker tag '${env.BACKEND_IMAGE}' '${env.BACKEND_IMAGE_PREFIX}:current'
          docker tag '${env.FRONTEND_IMAGE}' '${env.FRONTEND_IMAGE_PREFIX}:current'
          docker tag '${env.CMS_BACKEND_IMAGE}' '${env.CMS_BACKEND_IMAGE_PREFIX}:current'
          docker tag '${env.CMS_FRONTEND_IMAGE}' '${env.CMS_FRONTEND_IMAGE_PREFIX}:current'

          if [ -n '${env.PREVIOUS_BACKEND_IMAGE}' ] && [ '${env.PREVIOUS_BACKEND_IMAGE}' != '${env.BACKEND_IMAGE}' ]; then
            docker tag '${env.PREVIOUS_BACKEND_IMAGE}' '${env.BACKEND_IMAGE_PREFIX}:previous'
          fi

          if [ -n '${env.PREVIOUS_FRONTEND_IMAGE}' ] && [ '${env.PREVIOUS_FRONTEND_IMAGE}' != '${env.FRONTEND_IMAGE}' ]; then
            docker tag '${env.PREVIOUS_FRONTEND_IMAGE}' '${env.FRONTEND_IMAGE_PREFIX}:previous'
          fi

          if [ -n '${env.PREVIOUS_CMS_BACKEND_IMAGE}' ] && [ '${env.PREVIOUS_CMS_BACKEND_IMAGE}' != '${env.CMS_BACKEND_IMAGE}' ]; then
            docker tag '${env.PREVIOUS_CMS_BACKEND_IMAGE}' '${env.CMS_BACKEND_IMAGE_PREFIX}:previous'
          fi

          if [ -n '${env.PREVIOUS_CMS_FRONTEND_IMAGE}' ] && [ '${env.PREVIOUS_CMS_FRONTEND_IMAGE}' != '${env.CMS_FRONTEND_IMAGE}' ]; then
            docker tag '${env.PREVIOUS_CMS_FRONTEND_IMAGE}' '${env.CMS_FRONTEND_IMAGE_PREFIX}:previous'
          fi
        """
      }
    }

    stage('Prune Old Images') {
      steps {
        sh '''
          set -eu

          cleanup_repo() {
            repo="$1"
            keep_current="$2"
            keep_previous="$3"

            docker image ls "$repo" --format '{{.Repository}}:{{.Tag}}' | sort -u | while read -r image; do
              [ -n "$image" ] || continue

              case "$image" in
                "${repo}:current"|\
                "${repo}:previous"|\
                "$keep_current"|\
                "$keep_previous")
                  continue
                  ;;
              esac

              docker image rm "$image" || true
            done
          }

          cleanup_repo "${BACKEND_IMAGE_PREFIX}" "${BACKEND_IMAGE}" "${PREVIOUS_BACKEND_IMAGE:-}"
          cleanup_repo "${FRONTEND_IMAGE_PREFIX}" "${FRONTEND_IMAGE}" "${PREVIOUS_FRONTEND_IMAGE:-}"
          cleanup_repo "${CMS_BACKEND_IMAGE_PREFIX}" "${CMS_BACKEND_IMAGE}" "${PREVIOUS_CMS_BACKEND_IMAGE:-}"
          cleanup_repo "${CMS_FRONTEND_IMAGE_PREFIX}" "${CMS_FRONTEND_IMAGE}" "${PREVIOUS_CMS_FRONTEND_IMAGE:-}"
          docker image prune -f >/dev/null || true
        '''
      }
    }
  }

  post {
    success {
      echo "Deployment successful (${GIT_COMMIT_SHORT})"
    }
    failure {
      echo "Deployment failed (${GIT_COMMIT_SHORT})"
    }
    always {
      sh 'rm -f "$DEPLOY_ENV_FILE"'
    }
  }
}
