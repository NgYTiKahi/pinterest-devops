pipeline {
  agent any
  options { timestamps(); disableConcurrentBuilds(); buildDiscarder(logRotator(numToKeepStr: '10')) }
  triggers { pollSCM('H/5 * * * *') }
  environment {
    COMPOSE_PROJECT_NAME = 'pins-jenkins'
    BIND_ADDRESS = '0.0.0.0'
    WEB_PORT = '8080'
    COMPOSE_FILE = 'docker-compose.yml:ci/jenkins/app.override.yml'
  }
  stages {
    stage('Checkout') { steps { checkout scm } }
    stage('Configure') {
      steps {
        sh '''
          set -eu
          if [ -f /var/jenkins_home/pins-app.env ]; then
            cp /var/jenkins_home/pins-app.env .env
          else
            node scripts/setup.mjs
            cp .env /var/jenkins_home/pins-app.env
            chmod 600 /var/jenkins_home/pins-app.env
          fi
          docker compose config --quiet
        '''
      }
    }
    stage('Test and build') {
      steps {
        sh 'cd backend && npm ci && npm test'
        sh 'cd frontend && npm ci && npm run build'
        sh 'docker compose build'
      }
    }
    stage('Deploy local') {
      steps {
        sh 'docker compose up -d --no-build --wait --wait-timeout 240'
        sh 'docker compose exec -T backend node src/seed.js'
      }
    }
    stage('Verify') {
      steps {
        sh '''
          docker run --rm --network pins-jenkins_web \
            -v "$WORKSPACE/scripts:/scripts:ro" \
            node:24-alpine node /scripts/smoke.mjs http://frontend:8080
          docker compose exec -T prometheus promtool check config /etc/prometheus/prometheus.yml
        '''
      }
    }
  }
  post {
    failure { sh 'docker compose ps; docker compose logs --tail 80' }
    success { echo 'Local app: http://localhost:8081 | Grafana: http://localhost:3001' }
  }
}
