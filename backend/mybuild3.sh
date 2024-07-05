
# 컨테이너 멈추고
ssh -i src/main/resources/secret/key0527.pem ubuntu@54.180.116.92 'docker stop function'
# 컨테이너 삭제
ssh -i src/main/resources/secret/key0527.pem ubuntu@54.180.116.92 'docker rm function'
# pull image
ssh -i src/main/resources/secret/key0527.pem ubuntu@54.180.116.92 'docker pull joid1004058/function'
# 컨테이너 실행
ssh -i src/main/resources/secret/key0527.pem ubuntu@54.180.116.92 'docker run -d -p 8080:8080 --restart always --name function joid1004058/function'
