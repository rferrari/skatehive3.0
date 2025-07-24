"use client";

import React, { useState, useCallback } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  VStack,
  Input,
  IconButton,
  Text,
  Alert,
  AlertIcon,
  useDisclosure,
} from "@chakra-ui/react";
import { FaPlus, FaTrash, FaPercentage } from "react-icons/fa";

export interface Beneficiary {
  account: string;
  weight: number; // Weight in basis points (100 = 1%)
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
  const { isOpen, onToggle } = useDisclosure();
  const [errors, setErrors] = useState<string[]>([]);

  const addBeneficiary = useCallback(() => {
    const newBeneficiary = { account: "", weight: 500 };
    const updatedBeneficiaries = [...beneficiaries, newBeneficiary];
    console.log("🎯 BeneficiariesInput: Adding new beneficiary", {
      newBeneficiary,
      currentCount: beneficiaries.length,
      newCount: updatedBeneficiaries.length,
      updatedBeneficiaries,
    });
    setBeneficiaries(updatedBeneficiaries);
  }, [beneficiaries, setBeneficiaries]);

  const removeBeneficiary = useCallback(
    (index: number) => {
      const removedBeneficiary = beneficiaries[index];
      const newBeneficiaries = beneficiaries.filter((_, i) => i !== index);
      console.log("🗑️ BeneficiariesInput: Removing beneficiary", {
        index,
        removedBeneficiary,
        beforeCount: beneficiaries.length,
        afterCount: newBeneficiaries.length,
        newBeneficiaries,
      });
      setBeneficiaries(newBeneficiaries);
      validateBeneficiaries(newBeneficiaries);
    },
    [beneficiaries, setBeneficiaries]
  );

  const updateBeneficiary = useCallback(
    (index: number, field: keyof Beneficiary, value: string | number) => {
      const oldBeneficiary = beneficiaries[index];
      const newBeneficiaries = [...beneficiaries];

      if (field === "weight") {
        // Convert percentage to basis points (1% = 100 basis points)
        const percentage =
          typeof value === "string" ? parseFloat(value) || 0 : value;
        const weightInBasisPoints = Math.round(percentage * 100);
        newBeneficiaries[index][field] = weightInBasisPoints;

        console.log("📊 BeneficiariesInput: Updating beneficiary weight", {
          index,
          field,
          inputValue: value,
          percentage,
          weightInBasisPoints,
          oldValue: oldBeneficiary.weight,
          newValue: weightInBasisPoints,
          oldBeneficiary,
          newBeneficiary: newBeneficiaries[index],
        });
      } else {
        newBeneficiaries[index][field] = value as string;

        console.log("👤 BeneficiariesInput: Updating beneficiary account", {
          index,
          field,
          inputValue: value,
          oldValue: oldBeneficiary.account,
          newValue: value,
          oldBeneficiary,
          newBeneficiary: newBeneficiaries[index],
        });
      }

      setBeneficiaries(newBeneficiaries);
      validateBeneficiaries(newBeneficiaries);
    },
    [beneficiaries, setBeneficiaries]
  );

  const validateBeneficiaries = useCallback(
    (beneficiariesList: Beneficiary[]) => {
      console.log("✅ BeneficiariesInput: Starting validation", {
        beneficiariesList,
      });

      const validationErrors: string[] = [];

      // Check for empty accounts
      beneficiariesList.forEach((beneficiary, index) => {
        if (!beneficiary.account.trim()) {
          validationErrors.push(
            `Beneficiary ${index + 1}: Account name is required`
          );
        } else if (
          !/^[a-z][a-z0-9.-]*[a-z0-9]$/.test(beneficiary.account) ||
          beneficiary.account.length < 3 ||
          beneficiary.account.length > 16
        ) {
          validationErrors.push(
            `Beneficiary ${index + 1}: Invalid Hive account name`
          );
        }
      });

      // Check total weight doesn't exceed 100%
      const totalWeight = beneficiariesList.reduce(
        (sum, b) => sum + b.weight,
        0
      );
      const totalPercentage = totalWeight / 100;

      console.log("📈 BeneficiariesInput: Weight calculation", {
        beneficiariesList,
        individualWeights: beneficiariesList.map((b) => ({
          account: b.account,
          weight: b.weight,
          percentage: b.weight / 100,
        })),
        totalWeight,
        totalPercentage,
        isExceeding100: totalWeight > 10000,
      });

      if (totalWeight > 10000) {
        // 10000 basis points = 100%
        validationErrors.push(
          `Total beneficiary percentage cannot exceed 100% (currently ${totalPercentage.toFixed(
            1
          )}%)`
        );
      }

      // Check for duplicate accounts
      const accounts = beneficiariesList.map((b) => b.account.toLowerCase());
      const duplicates = accounts.filter(
        (account, index) => accounts.indexOf(account) !== index
      );
      if (duplicates.length > 0) {
        validationErrors.push(
          `Duplicate accounts found: ${duplicates.join(", ")}`
        );
      }

      console.log("🔍 BeneficiariesInput: Validation results", {
        validationErrors,
        hasErrors: validationErrors.length > 0,
        totalWeight,
        totalPercentage,
        duplicates,
      });

      setErrors(validationErrors);
    },
    []
  );

  const totalPercentage =
    beneficiaries.reduce((sum, b) => sum + b.weight, 0) / 100;

  // Add effect to log beneficiaries changes
  React.useEffect(() => {
    console.log("🔄 BeneficiariesInput: Beneficiaries state changed", {
      beneficiaries,
      count: beneficiaries.length,
      totalWeight: beneficiaries.reduce((sum, b) => sum + b.weight, 0),
      totalPercentage,
      isOpen,
      errors: errors.length,
    });
  }, [beneficiaries, totalPercentage, isOpen, errors.length]);

  return (
    <Box mb={4}>
      <Button
        size="sm"
        colorScheme="purple"
        variant="outline"
        onClick={onToggle}
        leftIcon={<FaPercentage />}
        isDisabled={isSubmitting}
      >
        Beneficiaries {beneficiaries.length > 0 && `(${beneficiaries.length})`}
      </Button>

      {isOpen && (
        <Box
          mt={3}
          p={4}
          border="1px solid"
          borderColor="purple.200"
          borderRadius="md"
          bg="background"
        >
          <VStack spacing={4} align="stretch">
            <Box>
              <Text fontSize="sm" color="gray.600" mb={2}>
                Set reward beneficiaries who will receive a percentage of this
                post&apos;s earnings.{" "}
              </Text>
              <Text fontSize="xs" color="gray.500">
                Total: {totalPercentage.toFixed(1)}% | Author keeps:{" "}
                {(100 - totalPercentage).toFixed(1)}%
              </Text>
            </Box>

            {beneficiaries.map((beneficiary, index) => (
              <HStack key={index} spacing={2}>
                <FormControl flex="2">
                  <FormLabel fontSize="xs" mb={1}>
                    Account
                  </FormLabel>
                  <Input
                    placeholder="hive-username"
                    value={beneficiary.account}
                    onChange={(e) =>
                      updateBeneficiary(index, "account", e.target.value)
                    }
                    size="sm"
                    isDisabled={isSubmitting}
                  />
                </FormControl>

                <FormControl flex="1">
                  <FormLabel fontSize="xs" mb={1}>
                    Percentage
                  </FormLabel>
                  <Input
                    type="number"
                    placeholder="5"
                    min="0.1"
                    max="100"
                    step="0.1"
                    value={(beneficiary.weight / 100).toFixed(1)}
                    onChange={(e) =>
                      updateBeneficiary(index, "weight", e.target.value)
                    }
                    size="sm"
                    isDisabled={isSubmitting}
                  />
                </FormControl>

                <IconButton
                  aria-label="Remove beneficiary"
                  icon={<FaTrash />}
                  size="sm"
                  colorScheme="red"
                  variant="ghost"
                  onClick={() => removeBeneficiary(index)}
                  isDisabled={isSubmitting}
                  mt={6}
                />
              </HStack>
            ))}

            <Button
              leftIcon={<FaPlus />}
              onClick={addBeneficiary}
              size="sm"
              variant="ghost"
              colorScheme="purple"
              isDisabled={isSubmitting || beneficiaries.length >= 8} // Hive limit is 8 beneficiaries
            >
              Add Beneficiary
            </Button>

            {errors.length > 0 && (
              <Alert status="error" size="sm">
                <AlertIcon />
                <VStack align="start" spacing={1}>
                  {errors.map((error, index) => (
                    <Text key={index} fontSize="xs">
                      {error}
                    </Text>
                  ))}
                </VStack>
              </Alert>
            )}

            {totalPercentage > 0 && errors.length === 0 && (
              <Alert status="info" size="sm">
                <AlertIcon />
                <Text fontSize="xs">
                  {beneficiaries.length} beneficiar
                  {beneficiaries.length === 1 ? "y" : "ies"} will receive{" "}
                  {totalPercentage.toFixed(1)}% of post rewards
                </Text>
              </Alert>
            )}
          </VStack>
        </Box>
      )}
    </Box>
  );
}
