import React, { memo, useContext, useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import styled from "styled-components";
import {
  Accordion,
  Button,
  Card,
  Col,
  Container,
  Form,
  Row
} from "react-bootstrap";
import { ArrowDownShort, QuestionCircle } from "react-bootstrap-icons";
import { useTranslation } from "react-i18next";
import { useWallet } from "use-wallet";

import { ChainIdContext } from "../../context/chainIdProvider/chainIdContext";
import { ethChainId } from "../../config";
import LockPeriod from "./lockPeriod";
import LockHeader from "./lockHeader";
import Layout from "../../components/layouts/layout";
import SwapContainer from "../../components/ui/swapContainer";
import CardTitle from "../../components/ui/cardTitle";
import InfoAlert from "../../components/ui/infoAlert";
import WrongChainModal from "../../components/ui/wrongChainModal";
import {
  getTokensUserBalanceLocked,
  increaseAmount,
  lockTokensTx
} from "../../utils/EthDataProvider/EthDataProvider";
import InfoSwapCard from "../../components/ui/infoSwapCard";

const HeaderText = styled.div`
  background-color: #f7f7f9;
`;

const IconWrapper = styled(Button)`
  margin: 15px;
  color: rgb(86, 90, 105);
  text-align: center;
  border: none;
  outline: none;
  font: inherit;
  color: inherit;
  background: none;
`;

const Lock = () => {
  const { t } = useTranslation();
  const { currentChainId, setCurrentChainId } = useContext(ChainIdContext);
  const methods = useForm({ mode: "onChange" });
  const wallet = useWallet();
  const [txDone, setTxDone] = useState(false);
  const [updatingBalance, setUpdatingBalance] = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [balance, setBalance] = useState();
  const [lockValue, setLockValue] = useState(7);
  const [currentHiIQ, setCurrentHiIQ] = useState(undefined);
  const [filledAmount, setFilledAmount] = useState();
  const [openWrongChainModal, setOpenWrongChainModal] = useState(false);
  const [token1] = useState({
    icon: "https://mindswap.finance/tokens/iq.png",
    name: "IQ",
    precision: 3,
    chain: "Ethereum"
  });

  const handleConfirmation = async result => {
    if (result === "success") {
      setCurrentHiIQ(await getTokensUserBalanceLocked(wallet));
    }

    setUpdatingBalance(false);
  };

  const onSubmit = async data => {
    if (!wallet.account) {
      return;
    }

    if (currentHiIQ !== 0)
      await increaseAmount(data.FromAmount, wallet, handleConfirmation);
    else await lockTokensTx(data.FromAmount, lockValue, wallet);

    setUpdatingBalance(true);

    setTxDone(true);
  };

  const handleSetLockValue = lv => {
    setLockValue(lv);
  };

  useEffect(() => {
    if (wallet.status === "connected" && wallet.ethereum)
      (async () => {
        setLoadingBalance(true);
        setCurrentHiIQ(Number(await getTokensUserBalanceLocked(wallet)));
        setLoadingBalance(false);
      })();

    if (wallet.status === "error" && !wallet.chainId === ethChainId)
      setOpenWrongChainModal(true);
  }, [wallet.status]);

  useEffect(() => {
    if (!currentChainId) {
      setCurrentChainId(ethChainId);
      wallet.reset();
    }
  }, [currentChainId]);

  return (
    <Layout>
      <Container className="p-2 mt-3" fluid>
        <FormProvider {...methods}>
          <Row>
            <Col>
              <CardTitle
                title="IQ Bridge"
                role="img"
                aria-label="lock"
                className="brain"
                icon="🔒"
              />
              <Card className="mx-auto shadow-sm">
                <Card.Body>
                  <Accordion>
                    <div className="d-flex flex-row justify-content-end">
                      {currentHiIQ !== undefined && (
                        <LockHeader
                          wallet={wallet}
                          currentHiIQ={currentHiIQ}
                          updatingBalance={updatingBalance}
                          loadingBalance={loadingBalance}
                        />
                      )}
                      <Accordion.Toggle
                        as={Button}
                        variant="light"
                        eventKey="0"
                        className="d-flex flex-row justify-content-center align-middle"
                      >
                        <Button variant="light">
                          <QuestionCircle />
                        </Button>
                      </Accordion.Toggle>
                    </div>
                    <Accordion.Collapse eventKey="0">
                      <HeaderText className="shadow-sm rounded p-3 text-justify m-3 highlight">
                        {t("lock_description")}
                      </HeaderText>
                    </Accordion.Collapse>
                  </Accordion>
                  <br />
                  <Form onSubmit={methods.handleSubmit(onSubmit)}>
                    {currentChainId === ethChainId && (
                      <SwapContainer
                        token={token1}
                        header="From"
                        setParentBalance={setBalance}
                        setFilled={val => setFilledAmount(val)}
                      />
                    )}
                    <div className="d-flex justify-content-center">
                      <IconWrapper bsPrefix="switch" onClick={() => {}}>
                        <ArrowDownShort />
                      </IconWrapper>
                    </div>
                    <br />
                    <LockPeriod
                      wallet={wallet}
                      updateParentLockValue={handleSetLockValue}
                    />
                    <br />
                    <Button
                      disabled={
                        !wallet.account ||
                        !balance ||
                        balance === 0 ||
                        lockValue === 0 ||
                        !filledAmount
                      }
                      variant="primary"
                      className="text-capitalize"
                      type="submit"
                      size="lg"
                      block
                    >
                      {t("lock")}
                    </Button>
                  </Form>
                </Card.Body>
              </Card>

              {lockValue !== 0 && filledAmount && balance && balance !== 0 && (
                <InfoSwapCard
                  tokensLocked={Number(filledAmount)}
                  timeLocked={Number(lockValue)}
                />
              )}
            </Col>
          </Row>
          {wallet.account && txDone && (
            <Row>
              <Col>
                <InfoAlert text="Tx executed" />
              </Col>
            </Row>
          )}
          {!wallet.account && (
            <Row>
              <Col>
                <InfoAlert text={t("login_info_eth_locking")} />
              </Col>
            </Row>
          )}
        </FormProvider>
      </Container>
      <WrongChainModal
        show={openWrongChainModal}
        currentChainId={currentChainId}
        ethChainId={ethChainId}
        onHide={() => setOpenWrongChainModal(false)}
      />
    </Layout>
  );
};

export default memo(Lock);
