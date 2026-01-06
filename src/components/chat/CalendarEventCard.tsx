/**
 * CalendarEventCard - Beautiful card to display calendar events in chat
 * Shows meeting details with Google Meet link and Calendar link
 */

import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Icon,
  Badge,
  Divider,
  useColorModeValue,
  Link,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';

// Icons as inline SVGs for better performance
const CalendarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const UsersIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const VideoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="23 7 16 12 23 17 23 7"/>
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </svg>
);

const ExternalLinkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/>
    <line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

interface CalendarEventCardProps {
  title: string;
  dateTime: string;
  attendees?: string[];
  meetLink?: string;
  calendarLink?: string;
  isSuccess?: boolean;
  error?: string;
}

const MotionBox = motion(Box);

export const CalendarEventCard: React.FC<CalendarEventCardProps> = ({
  title,
  dateTime,
  attendees = [],
  meetLink,
  calendarLink,
  isSuccess = true,
  error,
}) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const successColor = useColorModeValue('green.500', 'green.300');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const meetBtnBg = useColorModeValue('blue.500', 'blue.400');
  const calendarBtnBg = useColorModeValue('purple.500', 'purple.400');

  if (!isSuccess) {
    return (
      <MotionBox
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        bg="red.50"
        border="1px solid"
        borderColor="red.200"
        borderRadius="xl"
        p={4}
        maxW="400px"
      >
        <HStack spacing={3}>
          <Box color="red.500">❌</Box>
          <Text color="red.600" fontSize="sm">
            {error || 'Failed to schedule meeting'}
          </Text>
        </HStack>
      </MotionBox>
    );
  }

  return (
    <MotionBox
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      bg={bgColor}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="xl"
      overflow="hidden"
      maxW="400px"
      boxShadow="lg"
    >
      {/* Success Header */}
      <Box
        bgGradient="linear(to-r, green.400, teal.400)"
        px={4}
        py={3}
      >
        <HStack spacing={2}>
          <Box color="white">
            <CheckCircleIcon />
          </Box>
          <Text color="white" fontWeight="bold" fontSize="sm">
            Meeting Scheduled!
          </Text>
          <Badge colorScheme="whiteAlpha" ml="auto" fontSize="xs">
            Google Calendar
          </Badge>
        </HStack>
      </Box>

      {/* Content */}
      <VStack align="stretch" spacing={4} p={4}>
        {/* Title */}
        <HStack spacing={3}>
          <Box color={successColor}>
            <CalendarIcon />
          </Box>
          <Text fontWeight="bold" fontSize="lg">
            {title}
          </Text>
        </HStack>

        {/* Date & Time */}
        <HStack spacing={3} color={textColor}>
          <ClockIcon />
          <Text fontSize="sm">{dateTime}</Text>
        </HStack>

        {/* Attendees */}
        {attendees.length > 0 && (
          <HStack spacing={3} color={textColor}>
            <UsersIcon />
            <Text fontSize="sm">
              {attendees.join(', ')}
            </Text>
          </HStack>
        )}

        <Divider />

        {/* Action Buttons */}
        <VStack spacing={2} align="stretch">
          {meetLink && (
            <Button
              as={Link}
              href={meetLink}
              isExternal
              size="md"
              bg={meetBtnBg}
              color="white"
              _hover={{ bg: 'blue.600', textDecoration: 'none' }}
              leftIcon={<VideoIcon />}
              rightIcon={<ExternalLinkIcon />}
              justifyContent="space-between"
            >
              Join Google Meet
            </Button>
          )}

          {calendarLink && (
            <Button
              as={Link}
              href={calendarLink}
              isExternal
              size="sm"
              variant="outline"
              colorScheme="purple"
              leftIcon={<CalendarIcon />}
              rightIcon={<ExternalLinkIcon />}
              justifyContent="space-between"
            >
              View in Calendar
            </Button>
          )}
        </VStack>

        {/* Footer Note */}
        <Text fontSize="xs" color="gray.500" textAlign="center" mt={2}>
          ✉️ Calendar invites have been sent to all attendees
        </Text>
      </VStack>
    </MotionBox>
  );
};

/**
 * Parse calendar response from AI and extract event details
 */
export const parseCalendarResponse = (response: string): CalendarEventCardProps | null => {
  // Check if it's a successful calendar event response
  if (!response.includes('✅ **Meeting Scheduled!**')) {
    return null;
  }

  try {
    // Extract title
    const titleMatch = response.match(/📅 \*\*(.+?)\*\*/);
    const title = titleMatch ? titleMatch[1] : 'Meeting';

    // Extract date/time
    const dateTimeMatch = response.match(/🕐 (.+)/);
    const dateTime = dateTimeMatch ? dateTimeMatch[1] : '';

    // Extract attendees
    const attendeesMatch = response.match(/👥 Attendees: (.+)/);
    const attendees = attendeesMatch 
      ? attendeesMatch[1].split(', ').map(a => a.trim())
      : [];

    // Extract Meet link
    const meetLinkMatch = response.match(/\[Join Meeting\]\((.+?)\)/);
    const meetLink = meetLinkMatch ? meetLinkMatch[1] : undefined;

    // Extract Calendar link
    const calendarLinkMatch = response.match(/\[View in Google Calendar\]\((.+?)\)/);
    const calendarLink = calendarLinkMatch ? calendarLinkMatch[1] : undefined;

    return {
      title,
      dateTime,
      attendees,
      meetLink,
      calendarLink,
      isSuccess: true,
    };
  } catch (e) {
    console.error('Failed to parse calendar response:', e);
    return null;
  }
};

export default CalendarEventCard;
