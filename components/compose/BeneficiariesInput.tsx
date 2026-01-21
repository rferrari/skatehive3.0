"use client";

import React, { useState, useCallback } from "react";
import {
  Box,
  Button,
  FormControl,
  HStack,
  VStack,
  Input,
  IconButton,
  Text,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import { FaPlus, FaTrash } from "react-icons/fa";

export interface Beneficiary {
  account: string;
  weight: number;
  isValidAccount?: boolean;
}

interface BeneficiariesInputProps {
  beneficiaries: Beneficiary[];
  setBeneficiaries: (beneficiaries: Beneficiary[]) => void;
  isSubmitting?: boolean;
}

export default function BeneficiariesInput({
  beneficiaries,
  setBeneficiaries,
  isSubmitting = false,
}: BeneficiariesInputProps) {
  const [errors, setErrors] = useState<string[]>([]);

  const validateBeneficiaries = useCallback(
    (beneficiariesList: Beneficiary[]) => {
      const validationErrors: string[] = [];

      beneficiariesList.forEach((beneficiary, index) => {
        if (!beneficiary.account.trim()) {
          validationErrors.push(
            `Beneficiary ${index + 1}: Account name is required`
          );
        } else if (beneficiary.isValidAccount !== true) {
          validationErrors.push(
            `Beneficiary ${index + 1}: Please enter a valid Hive username`
          );
        }
      });

      const totalWeight = beneficiariesList.reduce(
        (sum, b) => sum + b.weight,
        0
      );
      const totalPercentage = totalWeight / 100;

      if (totalWeight > 10000) {
        validationErrors.push(
          `Total beneficiary percentage cannot exceed 100% (currently ${totalPercentage.toFixed(
            1
          )}%)`
        );
      }

      const accounts = beneficiariesList.map((b) => b.account.toLowerCase());
      const duplicates = accounts.filter(
        (account, index) => accounts.indexOf(account) !== index
      );
      if (duplicates.length > 0) {
        validationErrors.push(
          `Duplicate accounts found: ${duplicates.join(", ")}`
        );
      }

      setErrors(validationErrors);
    },
    []
  );

  const addBeneficiary = useCallback(() => {
    const newBeneficiary = { account: "", weight: 500, isValidAccount: false };
    const updatedBeneficiaries = [...beneficiaries, newBeneficiary];
    setBeneficiaries(updatedBeneficiaries);
  }, [beneficiaries, setBeneficiaries]);

  const removeBeneficiary = useCallback(
    (index: number) => {
      const newBeneficiaries = beneficiaries.filter((_, i) => i !== index);
      setBeneficiaries(newBeneficiaries);
      validateBeneficiaries(newBeneficiaries);
    },
    [beneficiaries, setBeneficiaries, validateBeneficiaries]
  );

  const updateBeneficiary = useCallback(
    (
      index: number,
      field: keyof Beneficiary,
      value: string | number | boolean
    ) => {
      const newBeneficiaries = [...beneficiaries];

      if (field === "weight") {
        const percentage =
          typeof value === "string"
            ? parseFloat(value) || 0
            : (value as number);
        const clampedPercentage = Math.max(0, Math.min(100, percentage));
        const weightInBasisPoints = Math.round(clampedPercentage * 100);
        newBeneficiaries[index][field] = weightInBasisPoints;
      } else if (field === "account") {
        newBeneficiaries[index][field] = value as string;
      } else if (field === "isValidAccount") {
        newBeneficiaries[index][field] = value as boolean;
      }

      setBeneficiaries(newBeneficiaries);
      validateBeneficiaries(newBeneficiaries);
    },
    [beneficiaries, setBeneficiaries, validateBeneficiaries]
  );

  const totalPercentage =
    beneficiaries.reduce((sum, b) => sum + b.weight, 0) / 100;

  React.useEffect(() => {}, [beneficiaries, totalPercentage, errors.length]);

  return (
    <Box>
      <VStack spacing={4} align="stretch">
        <Box>
          <Text
            letterSpacing="0.1em"
            fontSize="11px"
            color="#888"
            mb={2}
            fontWeight="600"
            textTransform="uppercase"
          >
            Beneficiaries
          </Text>
          <Text fontSize="14px" color="#b0b0b0">
            Set reward beneficiaries who will receive a percentage of this post&apos;s earnings.
          </Text>
          <Text fontSize="12px" color="#666" mt={1}>
            Total: <Text as="span" color="#6a9e6a">{totalPercentage.toFixed(1)}%</Text> | Author keeps:{" "}
            <Text as="span" color="#b0b0b0">{(100 - totalPercentage).toFixed(1)}%</Text>
          </Text>
        </Box>

        <VStack spacing={3} align="stretch">
          {beneficiaries.map((beneficiary, index) => (
            <HStack key={index} spacing={2}>
              <FormControl flex="2">
                <Input
                  placeholder="hive-username"
                  value={beneficiary.account}
                  onChange={(e) => {
                    updateBeneficiary(index, "account", e.target.value);
                    updateBeneficiary(index, "isValidAccount", false);
                  }}
                  size="md"
                  isDisabled={isSubmitting}
                  bg="#0d0e12"
                  border="1px solid rgba(255,255,255,0.08)"
                  color="#d8d8d8"
                  _placeholder={{ color: "#666" }}
                  _hover={{ borderColor: "rgba(255,255,255,0.15)" }}
                  _focus={{
                    borderColor: "#6a9e6a",
                    boxShadow: "0 0 0 1px #6a9e6a",
                  }}
                />
              </FormControl>

              <FormControl flex="1">
                <Input
                  type="number"
                  placeholder="5"
                  min="0.1"
                  max="100"
                  step="0.1"
                  value={beneficiary.weight / 100}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    if (inputValue === "") {
                      updateBeneficiary(index, "weight", 0);
                    } else {
                      updateBeneficiary(index, "weight", inputValue);
                    }
                  }}
                  size="md"
                  isDisabled={isSubmitting}
                  bg="#0d0e12"
                  border="1px solid rgba(255,255,255,0.08)"
                  color="#d8d8d8"
                  _placeholder={{ color: "#666" }}
                  _hover={{ borderColor: "rgba(255,255,255,0.15)" }}
                  _focus={{
                    borderColor: "#6a9e6a",
                    boxShadow: "0 0 0 1px #6a9e6a",
                  }}
                />
              </FormControl>

              <IconButton
                aria-label="Remove beneficiary"
                icon={<FaTrash size={12} />}
                size="md"
                variant="ghost"
                onClick={() => removeBeneficiary(index)}
                isDisabled={isSubmitting}
                color="#666"
                _hover={{ color: "#c87070", bg: "rgba(200,110,110,0.08)" }}
              />
            </HStack>
          ))}
        </VStack>

        <Button
          leftIcon={<FaPlus size={12} />}
          onClick={addBeneficiary}
          size="sm"
          variant="outline"
          color="#888"
          borderColor="rgba(255,255,255,0.12)"
          _hover={{
            borderColor: "#6a9e6a",
            color: "#6a9e6a",
            bg: "rgba(106,158,106,0.05)",
          }}
          isDisabled={isSubmitting || beneficiaries.length >= 8}
          h="36px"
        >
          Add Beneficiary
        </Button>

        {errors.length > 0 && (
          <Alert
            status="error"
            size="sm"
            bg="rgba(180,80,80,0.1)"
            border="1px solid rgba(180,80,80,0.2)"
          >
            <AlertIcon color="#c87070" />
            <VStack align="start" spacing={1}>
              {errors.map((error, index) => (
                <Text key={index} fontSize="12px" color="#c87070">
                  {error}
                </Text>
              ))}
            </VStack>
          </Alert>
        )}

        {totalPercentage > 0 && errors.length === 0 && (
          <Alert
            status="info"
            size="sm"
            bg="rgba(106,158,106,0.08)"
            border="1px solid rgba(106,158,106,0.15)"
          >
            <AlertIcon color="#6a9e6a" />
            <Text fontSize="12px" color="#b8b8b8">
              {beneficiaries.length}{" "}
              {beneficiaries.length === 1 ? "beneficiary" : "beneficiaries"}{" "}
              will receive {totalPercentage.toFixed(1)}% of post rewards
            </Text>
          </Alert>
        )}
      </VStack>
    </Box>
  );
}
