pipeline {
    agent any
    stages {
       stage('Execute Performance test') {
            steps {
              sh 'node shopizer.js'
            }
        }
        stage('Publish Report') {
            steps {
               sh 'archiveArtifacts artifacts: 'lighhouse.report.html'
            }
        } 
     }
 }