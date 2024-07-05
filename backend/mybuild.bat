cd ../frontend
npm run build
cd ../backend
rmdir /s /q src\main\resources\static
move ..\frontend\dist src\main\resources\static
gradlew.bat bootJar
docker build -t joid1004058/function .
docker push joid1004058/function
ssh -i src/main/resources/secret/key0527.pem ubuntu@54.180.116.92 'docker stop function'
ssh -i src/main/resources/secret/key0527.pem ubuntu@54.180.116.92 'docker rm function'
ssh -i src/main/resources/secret/key0527.pem ubuntu@54.180.116.92 'docker pull joid1004058/function'
ssh -i src/main/resources/secret/key0527.pem ubuntu@54.180.116.92 'docker run -d -p 8080:8080 --restart always --name function joid1004058/function'
