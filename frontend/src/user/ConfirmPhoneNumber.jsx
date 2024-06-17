import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  InputGroup,
  InputLeftAddon,
  InputRightElement,
} from "@chakra-ui/react";
import { CheckIcon } from "@chakra-ui/icons";
import { useContext } from "react";
import { SignupCodeContext } from "./SignupCodeProvider.jsx";

export function ConfirmPhoneNumber() {
  const codeInfo = useContext(SignupCodeContext);

  return (
    <Box>
      <FormControl>
        <InputGroup size="md">
          <InputLeftAddon bg={"none"} border={"none"}>
            010
          </InputLeftAddon>
          <Input
            pr="4.5rem"
            variant="flushed"
            type="number"
            value={codeInfo.phoneNumber}
            placeholder={"phone number"}
            onChange={(e) => {
              codeInfo.handleInputPhoneNumber(e.target.value);
            }}
          />
          <InputRightElement width="4.5rem">
            {codeInfo.isSendingCode || (
              <Button
                Button
                h="1.75rem"
                size="sm"
                onClick={codeInfo.handleSendCode}
                isDisabled={codeInfo.isWrongPhoneNumberLength}
              >
                인증 요청
              </Button>
            )}
            {codeInfo.isSendingCode && (
              <Button
                Button
                h="1.75rem"
                size="sm"
                onClick={codeInfo.handleSendCode}
                isDisabled={codeInfo.isWrongPhoneNumberLength}
              >
                재전송
              </Button>
            )}
          </InputRightElement>
        </InputGroup>
        <FormHelperText>
          휴대폰 번호는 010과 (-)를 제외한 숫자만 입력해주세요 ex)11112222
        </FormHelperText>
      </FormControl>
      <FormControl>
        <FormLabel>인증번호 입력</FormLabel>
        <InputGroup size="md">
          <Input
            pr="4.5rem"
            variant="flushed"
            type="number"
            placeholder={"인증번호를 입력하세요"}
            onChange={(e) => codeInfo.handleInputCode(e.target.value)}
          />
          <InputRightElement width="4.5rem">
            {codeInfo.isCheckedCode || (
              <Button
                h="1.75rem"
                size="sm"
                onClick={codeInfo.handleCheckCode}
                isDisabled={codeInfo.isDisabledCheckButton}
              >
                확인
              </Button>
            )}
            {codeInfo.isCheckedCode && <CheckIcon color="green.500" />}
          </InputRightElement>
        </InputGroup>
      </FormControl>
    </Box>
  );
}
