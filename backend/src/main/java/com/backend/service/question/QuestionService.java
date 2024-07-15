package com.backend.service.question;

import com.backend.domain.question.Faq;
import com.backend.domain.question.FaqCategory;
import com.backend.domain.question.Question;
import com.backend.domain.question.QuestionFile;
import com.backend.mapper.question.QuestionCommentMapper;
import com.backend.mapper.question.QuestionMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.ObjectCannedACL;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional(rollbackFor = Exception.class)
@RequiredArgsConstructor
public class QuestionService {
    private final QuestionMapper mapper;
    private final QuestionCommentMapper commentMapper;
    private final S3Client s3Client;

    @Value("${aws.s3.bucket.name}")
    String bucketName;

    @Value("${image.src.prefix}")
    String srcPrefix;

    public void add(Question question, MultipartFile[] files, Authentication authentication) throws IOException {

        // userId를 인증된 사용자의 id로 셋팅
        question.setUserId(Integer.valueOf(authentication.getName()));

        mapper.insert(question);

        if (files != null) {
            for (MultipartFile file : files) {
                mapper.insertFileName(question.getId(), file.getOriginalFilename());

                String key = STR."prj3/\{question.getId()}/\{file.getOriginalFilename()}";
                PutObjectRequest objectRequest = PutObjectRequest.builder()
                        .bucket(bucketName)
                        .key(key)
                        .acl(ObjectCannedACL.PUBLIC_READ)
                        .build();

                s3Client.putObject(objectRequest,
                        RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
            }
        }
    }

    public boolean validate(Question question) {
        if (question.getTitle() == null || question.getTitle().isBlank()) {
            return false;
        }
        if (question.getContent() == null || question.getContent().isBlank()) {
            return false;
        }
        return true;
    }

    public Map<String, Object> list(Integer page, String searchType, String keyword) {
        Map pageInfo = new HashMap<>();

        Integer countAll = mapper.countAllWithSearch(searchType, keyword);

        Integer offset = (page - 1) * 10;
        Integer lastPageNumber = (countAll - 1) / 10 + 1;
        Integer leftPageNumber = (page - 1) / 5 * 5 + 1;
        Integer rightPageNumber = leftPageNumber + 4;
        rightPageNumber = Math.min(rightPageNumber, lastPageNumber);
        leftPageNumber = rightPageNumber - 4;
        leftPageNumber = Math.max(leftPageNumber, 1);
        Integer prevPageNumber = leftPageNumber - 1;
        Integer nextPageNumber = rightPageNumber + 1;

        //  이전,처음,다음,맨끝 버튼 만들기
        if (prevPageNumber > 0) {
            pageInfo.put("prevPageNumber", prevPageNumber);
        }
        if (nextPageNumber <= lastPageNumber) {
            pageInfo.put("nextPageNumber", nextPageNumber);
        }
        pageInfo.put("currentPageNumber", page);
        pageInfo.put("lastPageNumber", lastPageNumber);
        pageInfo.put("leftPageNumber", leftPageNumber);
        pageInfo.put("rightPageNumber", rightPageNumber);
        pageInfo.put("totalPostNumber", countAll);

        List<Question> questions = mapper.selectUsingPageable(offset, searchType, keyword);
        questions.forEach(q -> q.setIsNewBadge(q.getIsNewBadge()));

        return Map.of("pageInfo", pageInfo,
                "content", questions);// "content" 키의 값으로 questions 리스트 반환
    }

    public Question get(Integer id) {
        mapper.updateCountById(id);
        Question question = mapper.selectById(id);
        if (question == null) {
            return null;
        }
        Question prevQuestion = mapper.getPrevId(id);
        Question nextQuestion = mapper.getNextId(id);

        if (prevQuestion != null) {
            question.setPrevId(prevQuestion.getPrevId());
            question.setPrevTitle(prevQuestion.getPrevTitle());
            question.setPrevSecret(prevQuestion.getPrevSecret());
            question.setPrevUserId(prevQuestion.getPrevUserId());
        }

        if (nextQuestion != null) {
            question.setNextId(nextQuestion.getNextId());
            question.setNextTitle(nextQuestion.getNextTitle());
            question.setNextSecret(nextQuestion.getNextSecret());
            question.setNextUserId(nextQuestion.getNextUserId());
        }

        List<String> filesNames = mapper.selectFileByQuestionId(id);
        List<QuestionFile> files = filesNames.stream()
                .map(name -> new QuestionFile(name, STR."\{srcPrefix}\{question.getId()}/\{name}"))
                .toList();
        question.setFileList(files);
        return question;
    }

    public void delete(Integer id) {
        commentMapper.deleteCommentByQuestionId(id);
        mapper.deleteByIdFile(id);
        mapper.deleteById(id);
    }

    public void edit(Question question, MultipartFile[] addFileList, List<String> removeFileList) throws IOException {

        // 파일 먼저 지우고 파일 추가
        if (removeFileList != null && removeFileList.size() > 0) {
            for (String name : removeFileList) {
                String key = STR."prj3/\{question.getId()}/\{name}";
                DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                        .bucket(bucketName)
                        .key(key)
                        .build();
                s3Client.deleteObject(deleteObjectRequest);
                mapper.deleteFileByIdAndFileName(question.getId(), name);
            }
        }

        if (addFileList != null && addFileList.length > 0) {
            List<String> fileNameList = mapper.selectFileByQuestionId(question.getId());
            for (MultipartFile file : addFileList) {
                String name = file.getOriginalFilename();
                if (!fileNameList.contains(name)) {
                    mapper.insertFileName(question.getId(), name);
                }

                String key = STR."prj3/\{question.getId()}/\{file.getOriginalFilename()}";
                PutObjectRequest objectRequest = PutObjectRequest.builder()
                        .bucket(bucketName)
                        .key(key)
                        .acl(ObjectCannedACL.PUBLIC_READ)
                        .build();

                s3Client.putObject(objectRequest,
                        RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
            }
        }
        mapper.updateById(question);
    }

    public boolean hasAccess(Integer id, Authentication authentication) {
        Question question = mapper.selectById(id);
        if (question == null || authentication == null) {
            return false;
        }
        return question.getUserId().equals(Integer.valueOf(authentication.getName()));
    }

    public List<Faq> getFaq(String category) {
        return mapper.getFaqList(category);
    }

    public List<FaqCategory> getAllCategories() {
        return mapper.getAllCategories();
    }

    public Map<String, Integer> getQuestionCount(Integer userId) {
        Map<String, Integer> totalQuestionCount = new HashMap<>();
        totalQuestionCount.put("totalQuestionCount", mapper.selectTotalQuestionCount(userId));
        return totalQuestionCount;
    }
}
