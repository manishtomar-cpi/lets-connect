pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                // Pull the latest code from GitHub
                git 'https://github.com/manishtomar-cpi/lets-connect.git'
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    // Build the Docker image
                    docker.build('lets-connect')
                }
            }
        }

        stage('Run Docker Container') {
            steps {
                script {
                    // Run the Docker container
                    docker.run('lets-connect', '-p 3000:3000')
                }
            }
        }
    }
}
