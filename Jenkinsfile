pipeline {
    agent any
    stages {
       stage('Execute Performance test') {
             steps {
                sh 'node shopizer.js'
            }
       }
        stage("Publish Report") {
              steps {
                 archiveArtifacts artifacts: 'lighthouse.report.html'
              }
        }
    }
}